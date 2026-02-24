"""Basic tests for the memory API endpoints."""

import asyncio
import json
import unittest
from unittest.mock import MagicMock, patch

from aiohttp.test_utils import AioHTTPTestCase

from bmo.memory_api import create_app


class MemoryApiTests(AioHTTPTestCase):

    async def get_application(self):
        return create_app()

    @patch("bmo.memory_api.mem0_client")
    async def test_get_memories_valid_pin(self, mock_client: MagicMock):
        mock_client.get_all.return_value = {
            "results": [
                {"id": "a1", "memory": "Likes coffee", "metadata": {"category": "preferences"}},
                {"id": "a2", "memory": "Name is Glenn", "metadata": {"category": "personal_facts"}},
            ]
        }
        resp = await self.client.request("GET", "/api/memories?pin=4869")
        self.assertEqual(resp.status, 200)
        body = await resp.json()
        self.assertIn("memories", body)
        self.assertEqual(len(body["memories"]), 2)
        categories = {m["category"] for m in body["memories"]}
        self.assertEqual(categories, {"preferences", "personal_facts"})

    async def test_get_memories_wrong_pin(self):
        resp = await self.client.request("GET", "/api/memories?pin=0000")
        self.assertEqual(resp.status, 401)

    async def test_get_memories_no_pin(self):
        resp = await self.client.request("GET", "/api/memories")
        self.assertEqual(resp.status, 401)

    @patch("bmo.memory_api.mem0_client")
    async def test_update_memory_valid(self, mock_client: MagicMock):
        mock_client.update.return_value = None
        resp = await self.client.request(
            "PUT",
            "/api/memories/abc123?pin=4869",
            json={"memory": "Updated text"},
        )
        self.assertEqual(resp.status, 200)
        body = await resp.json()
        self.assertTrue(body["ok"])
        mock_client.update.assert_called_once_with("abc123", "Updated text")

    @patch("bmo.memory_api.mem0_client")
    async def test_update_memory_empty_text(self, mock_client: MagicMock):
        resp = await self.client.request(
            "PUT",
            "/api/memories/abc123?pin=4869",
            json={"memory": "   "},
        )
        self.assertEqual(resp.status, 400)

    async def test_update_memory_wrong_pin(self):
        resp = await self.client.request(
            "PUT",
            "/api/memories/abc123?pin=0000",
            json={"memory": "text"},
        )
        self.assertEqual(resp.status, 401)

    @patch("bmo.memory_api.mem0_client")
    async def test_get_memories_uncategorized_fallback(self, mock_client: MagicMock):
        mock_client.get_all.return_value = {
            "results": [
                {"id": "b1", "memory": "Some note", "metadata": {}},
            ]
        }
        resp = await self.client.request("GET", "/api/memories?pin=4869")
        self.assertEqual(resp.status, 200)
        body = await resp.json()
        self.assertEqual(body["memories"][0]["category"], "uncategorized")

    async def test_options_cors(self):
        resp = await self.client.request("OPTIONS", "/api/memories")
        self.assertEqual(resp.status, 204)
        self.assertEqual(resp.headers.get("Access-Control-Allow-Origin"), "*")


if __name__ == "__main__":
    unittest.main()
