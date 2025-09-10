"""
    This ia a simple example of using LangChain to create a ReAct agent that uses a custom tool
"""

from typing import List, Union, Tuple
from dotenv import load_dotenv
from langchain.agents import tool
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain.agents.output_parsers import ReActSingleInputOutputParser
from langchain_core.output_parsers import BaseOutputParser
from langchain_core.tools import Tool
from langchain_core.agents import AgentAction, AgentFinish
from callbacks import AgentCallbackHandler

load_dotenv()

def render_text_description(tools):
    """Custom function to render tool descriptions as text."""
    descriptions = []
    for tool in tools:
        descriptions.append(f"{tool.name}: {tool.description}")
    return "\n".join(descriptions)

@tool
def get_text_length(text: str) -> int:
    """Returns the length of the given text by characters."""
    print(f"get_text_length enter with {text}")
    return len(text)

def find_tool_by_name(tools: List[Tool], tool_name: str) -> Tool:
    """Helper function to find a tool by its name."""
    for tool in tools:
        if tool.name == tool_name:
            return tool
    raise ValueError(f"Tool with name {tool_name} not found.")

if __name__ == "__main__":
    print("Hello ReAct Langchain using custom tool description renderer")
    tools = [get_text_length]
    

    # NOTE: No leading indentation in template so stop tokens match exactly.
    # We introduce an agent_scratchpad placeholder to accumulate prior steps.
    template = """Answer the following questions as best you can. You have access to the following tools:\n\n{tools}\n\nUse the following format:\n\nQuestion: the input question you must answer\nThought: you should always think about what to do next\nAction: the action to take, should be one of [{tool_names}]\nAction Input: the input to the action (a short Python literal / value)\nObservation: the result of the action\n... (this Thought/Action/Action Input/Observation can repeat N times)\nThought: I now know the final answer\nFinal Answer: the final answer to the original input question\n\nBegin!\n\nQuestion: {input}\n{agent_scratchpad}Thought:"""

    prompt = PromptTemplate(
        template=template,
        input_variables=["input", "agent_scratchpad"],
        partial_variables={
            "tools": render_text_description(tools),
            "tool_names": ", ".join([tool.name for tool in tools]),
        },
    )

    # Stop generation right before the model tries to write an Observation or a Final Answer.
    llm = ChatOpenAI(temperature=0, stop=["\nObservation:", "\nFinal Answer:"], callbacks=[AgentCallbackHandler()])

    class SimpleReActParser(BaseOutputParser):
        """Lenient parser that supports either an Action block or a Final Answer line.

        Expected segments (some optional):
        Thought: ...\nAction: <tool>\nAction Input: <input>
        or
        Thought: I now know the final answer\nFinal Answer: <answer>
        """

        def parse(self, text: str):  # type: ignore[override]
            # Normalize
            stripped = text.strip()
            # If final answer present
            if "Final Answer:" in stripped:
                final_part = stripped.split("Final Answer:", 1)[1].strip()
                return AgentFinish(return_values={"output": final_part}, log=text)
            # Else try to find action
            lines = [l.strip() for l in stripped.splitlines() if l.strip()]
            action = None
            action_input = None
            for i, line in enumerate(lines):
                if line.lower().startswith("action:"):
                    action = line.split(":", 1)[1].strip()
                if line.lower().startswith("action input"):
                    action_input = line.split(":", 1)[1].strip()
            if action and action_input is not None:
                # Strip quotes if present
                if action_input.startswith('"') and action_input.endswith('"'):
                    action_input = action_input[1:-1]
                elif action_input.startswith("'") and action_input.endswith("'"):
                    action_input = action_input[1:-1]
                return AgentAction(tool=action, tool_input=action_input, log=text)
            # Fallback: treat entire text as final answer
            return AgentFinish(return_values={"output": stripped}, log=text)

        @property
        def _type(self) -> str:
            return "simple_react_parser"

    agent = prompt | llm | SimpleReActParser()

    question = "What is the length in characters of the text Dog?"

    # Keep track of (AgentAction, observation) tuples
    intermediate_steps: List[Tuple[AgentAction, str]] = []

    def build_scratchpad(steps: List[Tuple[AgentAction, str]]) -> str:
        scratch = ""
        for action, obs in steps:
            # action.log already contains the Thought/Action/Action Input lines produced
            scratch += action.log
            scratch += f"\nObservation: {obs}\nThought: "
        return scratch

    from langchain_core.exceptions import OutputParserException

    for iteration in range(5):  # simple safety cap
        scratchpad = build_scratchpad(intermediate_steps)
        try:
            agent_step: Union[AgentAction, AgentFinish] = agent.invoke(
                {"input": question, "agent_scratchpad": scratchpad}
            )
        except OutputParserException as e:
            text = str(e)
            if "I now know the final answer" in text and "Final Answer:" not in scratchpad:
                # Force model to emit the final answer by prompting again with explicit cue
                scratchpad += "I now know the final answer\nFinal Answer:"
                agent_step = agent.invoke(
                    {"input": question, "agent_scratchpad": scratchpad}
                )
            else:
                raise

        if isinstance(agent_step, AgentFinish):
            print("Final Answer:", agent_step.return_values.get("output", agent_step.return_values))
            break

        # Otherwise run the tool selected
        tool_name = agent_step.tool
        tool_to_use = find_tool_by_name(tools, tool_name)
        tool_input = agent_step.tool_input
        observation = tool_to_use.func(str(tool_input))
        print(f"Tool `{tool_name}` called with input `{tool_input}` -> {observation}")
        intermediate_steps.append((agent_step, str(observation)))
    else:
        print("Reached max iterations without finishing.")


