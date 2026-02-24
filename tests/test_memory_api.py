"""Tests for the FastAPI memory API service."""

import sys
import os
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "services", "memory-api"))

with patch.dict(os.environ, {"QDRANT_HOST": "localhost", "GOOGLE_API_KEY": "fake"}):
    with patch("mem0.Memory.from_config", return_value=MagicMock()):
        import main as memory_api_main

from fastapi.testclient import TestClient


class MemoryApiTests(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(memory_api_main.app)

    @patch.object(memory_api_main, "mem0_client")
    def test_get_memories_valid_pin(self, mock_client: MagicMock):
        mock_client.get_all.return_value = {
            "results": [
                {"id": "a1", "memory": "Likes coffee", "metadata": {"category": "preferences"}},
                {"id": "a2", "memory": "Name is Glenn", "metadata": {"category": "personal_facts"}},
            ]
        }
        resp = self.client.get("/api/memories?pin=4869")
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertIn("memories", body)
        self.assertEqual(len(body["memories"]), 2)
        categories = {m["category"] for m in body["memories"]}
        self.assertEqual(categories, {"preferences", "personal_facts"})

    def test_get_memories_wrong_pin(self):
        resp = self.client.get("/api/memories?pin=0000")
        self.assertEqual(resp.status_code, 401)

    def test_get_memories_no_pin(self):
        resp = self.client.get("/api/memories")
        self.assertEqual(resp.status_code, 401)

    @patch.object(memory_api_main, "mem0_client")
    def test_update_memory_valid(self, mock_client: MagicMock):
        mock_client.update.return_value = None
        resp = self.client.put(
            "/api/memories/abc123?pin=4869",
            json={"memory": "Updated text"},
        )
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body["ok"])
        mock_client.update.assert_called_once_with("abc123", "Updated text")

    @patch.object(memory_api_main, "mem0_client")
    def test_update_memory_empty_text(self, mock_client: MagicMock):
        resp = self.client.put(
            "/api/memories/abc123?pin=4869",
            json={"memory": "   "},
        )
        self.assertEqual(resp.status_code, 400)

    def test_update_memory_wrong_pin(self):
        resp = self.client.put(
            "/api/memories/abc123?pin=0000",
            json={"memory": "text"},
        )
        self.assertEqual(resp.status_code, 401)

    @patch.object(memory_api_main, "mem0_client")
    def test_get_memories_uncategorized_fallback(self, mock_client: MagicMock):
        mock_client.get_all.return_value = {
            "results": [
                {"id": "b1", "memory": "Some note", "metadata": {}},
            ]
        }
        resp = self.client.get("/api/memories?pin=4869")
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body["memories"][0]["category"], "uncategorized")

    @patch.object(memory_api_main, "mem0_client")
    def test_get_memories_includes_timestamps(self, mock_client: MagicMock):
        mock_client.get_all.return_value = {
            "results": [
                {
                    "id": "t1",
                    "memory": "Test",
                    "metadata": {"category": "goals"},
                    "created_at": "2025-01-15T10:00:00Z",
                    "updated_at": "2025-01-16T12:00:00Z",
                },
            ]
        }
        resp = self.client.get("/api/memories?pin=4869")
        self.assertEqual(resp.status_code, 200)
        mem = resp.json()["memories"][0]
        self.assertEqual(mem["created_at"], "2025-01-15T10:00:00Z")
        self.assertEqual(mem["updated_at"], "2025-01-16T12:00:00Z")

    @patch.object(memory_api_main, "mem0_client")
    def test_add_memory_valid(self, mock_client: MagicMock):
        mock_client.add.return_value = {"results": [{"id": "new1"}]}
        resp = self.client.post(
            "/api/memories?pin=4869",
            json={"memory": "New memory", "category": "goals"},
        )
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body["ok"])
        self.assertEqual(body["category"], "goals")
        mock_client.add.assert_called_once()

    @patch.object(memory_api_main, "mem0_client")
    def test_add_memory_default_category(self, mock_client: MagicMock):
        mock_client.add.return_value = {"results": [{"id": "new2"}]}
        resp = self.client.post(
            "/api/memories?pin=4869",
            json={"memory": "No category given"},
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["category"], "uncategorized")

    @patch.object(memory_api_main, "mem0_client")
    def test_add_memory_empty_text(self, mock_client: MagicMock):
        resp = self.client.post(
            "/api/memories?pin=4869",
            json={"memory": "   ", "category": "goals"},
        )
        self.assertEqual(resp.status_code, 400)

    def test_add_memory_wrong_pin(self):
        resp = self.client.post(
            "/api/memories?pin=0000",
            json={"memory": "text"},
        )
        self.assertEqual(resp.status_code, 401)

    @patch.object(memory_api_main, "mem0_client")
    def test_update_memory_with_category(self, mock_client: MagicMock):
        mock_client.update.return_value = None
        with patch("main.QdrantClient") as MockQdrant:
            mock_qdrant_instance = MagicMock()
            MockQdrant.return_value = mock_qdrant_instance
            resp = self.client.put(
                "/api/memories/abc123?pin=4869",
                json={"memory": "Updated", "category": "goals"},
            )
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp.json()["category"], "goals")
            mock_qdrant_instance.set_payload.assert_called_once()

    @patch.object(memory_api_main, "mem0_client")
    def test_delete_memory_valid(self, mock_client: MagicMock):
        mock_client.delete.return_value = None
        resp = self.client.delete("/api/memories/abc123?pin=4869")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()["ok"])
        mock_client.delete.assert_called_once_with("abc123")

    def test_delete_memory_wrong_pin(self):
        resp = self.client.delete("/api/memories/abc123?pin=0000")
        self.assertEqual(resp.status_code, 401)

    def test_cors_headers(self):
        resp = self.client.get("/api/memories?pin=0000", headers={"Origin": "http://localhost:3001"})
        self.assertIn("access-control-allow-origin", resp.headers)


if __name__ == "__main__":
    unittest.main()
