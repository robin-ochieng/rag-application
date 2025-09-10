from typing import Any, Dict, List, Optional
from langchain_core.callbacks.base import BaseCallbackHandler
from langchain.schema import LLMResult, AgentAction, AgentFinish

class AgentCallbackHandler(BaseCallbackHandler):
    """A callback handler for agent actions and observations."""
    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> Any:
        """Run when LLM starts."""
        print(f"***LLM Started with prompts:***\n{prompts[0]}")
        print("**************")

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> Any:
        """Run when LLM ends."""
        print(f"***LLM Ended with response:***\n{response.generations[0][0].text}")
        print("**************")
        return super().on_llm_end(response, **kwargs)