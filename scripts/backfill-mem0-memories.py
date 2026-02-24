from __future__ import annotations

import argparse
import sys
from pathlib import Path


def _ensure_repo_on_path() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))


_ensure_repo_on_path()


def main() -> int:
    parser = argparse.ArgumentParser(description="Backfill legacy Mem0 memories into categorized canonical memories.")
    parser.add_argument("--user-id", default="glenn")
    parser.add_argument("--limit", type=int, default=5000)
    parser.add_argument("--related-limit", type=int, default=25)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--keep-original", action="store_true")
    parser.add_argument("--progress-every", type=int, default=25)
    args = parser.parse_args()

    delete_original = not args.keep_original

    from bmo.config import mem0_client  # noqa: E402
    from bmo.llm_gatekeeper import run_llm_gatekeeper  # noqa: E402
    from bmo.memory_policy import gatekeep_durable_memories  # noqa: E402

    if mem0_client is None:
        print("Mem0 client is not initialized. Check Qdrant connectivity and GOOGLE_API_KEY.")
        return 2

    if args.dry_run:
        print("dry_run=true (no writes will be performed)")

    print(f"Fetching up to {args.limit} memories for user_id={args.user_id}...")
    all_result = mem0_client.get_all(user_id=args.user_id, limit=args.limit)
    results = all_result.get("results", []) if isinstance(all_result, dict) else all_result
    if not isinstance(results, list):
        print("Unexpected get_all response shape")
        return 3

    total = len(results)
    print(f"Loaded {total} memories")
    processed = 0
    skipped_already_categorized = 0
    kept_skip = 0
    converted = 0
    deleted = 0
    errors = 0

    for mem in results:
        processed += 1
        if not isinstance(mem, dict):
            continue

        memory_id = mem.get("id")
        text = mem.get("memory")
        metadata = mem.get("metadata") if isinstance(mem.get("metadata"), dict) else {}
        category = metadata.get("category")

        if not isinstance(memory_id, str) or not isinstance(text, str) or not text.strip():
            continue

        if isinstance(category, str) and category.strip():
            skipped_already_categorized += 1
            continue

        try:
            related = mem0_client.search(text, user_id=args.user_id, limit=args.related_limit)
            related_list = related.get("results", []) if isinstance(related, dict) else related
            if not isinstance(related_list, list):
                related_list = []

            gate = run_llm_gatekeeper(user_text=text, existing_memories=related_list)

            stored_any = False
            if gate.status == "store":
                for action in gate.actions:
                    if not args.dry_run:
                        mem0_client.add(
                            [{"role": "user", "content": action.text}],
                            user_id=args.user_id,
                            metadata={
                                "category": action.category.value,
                                "mode": "gated",
                                "source": "backfill_llm",
                                "backfill_from": memory_id,
                            },
                            infer=False,
                        )
                    stored_any = True

            elif gate.status == "error":
                decision = gatekeep_durable_memories(text)
                if decision.should_store:
                    for item in decision.items:
                        if not args.dry_run:
                            mem0_client.add(
                                [{"role": "user", "content": item.text}],
                                user_id=args.user_id,
                                metadata={
                                    "category": item.category.value,
                                    "mode": "gated",
                                    "source": "backfill_heuristic",
                                    "backfill_from": memory_id,
                                },
                                infer=False,
                            )
                        stored_any = True

            else:
                kept_skip += 1

            if stored_any:
                converted += 1
                if delete_original:
                    if not args.dry_run:
                        mem0_client.delete(memory_id)
                    deleted += 1

        except Exception as e:
            errors += 1
            print(f"[{processed}/{total}] error on {memory_id}: {e}")

        if args.progress_every > 0 and processed % args.progress_every == 0:
            print(
                f"progress {processed}/{total} | converted={converted} deleted={deleted} "
                f"categorized_skip={skipped_already_categorized} skip={kept_skip} errors={errors}"
            )

    print("---")
    print(f"total={total}")
    print(f"processed={processed}")
    print(f"already_categorized={skipped_already_categorized}")
    print(f"converted={converted}")
    print(f"deleted_original={deleted if delete_original else 0}")
    print(f"kept_skip={kept_skip}")
    print(f"errors={errors}")
    if args.dry_run:
        print("dry_run=true")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
