"""PRD review-queue gateway command: /prd list|show|approve|reject.

Bound onto ``GatewayRunner`` through ``GatewaySlashCommandsMixin`` (same
shape as the goal commands). Review is human judgment — the handler runs the
shared dispatch off-loop with profile scope and returns the output as the
reply; it never starts turns or spends model calls.
"""

from __future__ import annotations

import logging

from gateway.platforms.event import MessageEvent

logger = logging.getLogger("gateway.run")


class GatewayPrdCommandsMixin:
    """PRD review-queue gateway command: /prd."""

    async def _handle_prd_command(self, event: MessageEvent) -> str:
        from hermes_cli.prd_command import dispatch_prd_command

        actor = f"reviewer:{getattr(event.source, 'user_id', None) or 'gateway'}"

        def dispatch():
            return dispatch_prd_command(event.get_command_args() or "", actor=actor)

        # Store I/O stays off the messaging event loop; the executor hop
        # carries profile scope so a routed profile reads its own PRDs.
        result = await self._run_in_executor_with_context(dispatch)
        return result.output
