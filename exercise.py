"""
🔧 **Tool Calling Exercise - From ReAct Prompting to Modern Tool Calling**

Welcome to the LangChain Tool Calling Exercise! 🚀

In this exercise, you'll modernize a ReAct agent by replacing prompt-based tool selection 
with native LLM tool calling capabilities. This represents the evolution from manual 
prompting to vendor-optimized tool calling.

**Your Mission:**
- Replace the ReAct prompt template with `.bind_tools()` 
- Handle tool calls from model responses directly
- Create a cleaner, more reliable agent loop

**Functions to Implement:**
All functions starting with `implement_` need your implementation!

Note: This uses simulated LangChain classes since third-party packages aren't allowed in Udemy exercises.
The API is identical to real LangChain, so this code transfers directly to production!
"""

import os
from typing import List, Any, Dict

# LangChain-compatible classes (simulated for exercise)
class Tool:
    """Tool class simulating LangChain's @tool decorator."""
    def __init__(self, name: str, description: str, func):
        self.name = name
        self.description = description
        self.func = func
    
    def invoke(self, input_data):
        return self.func(input_data)

class AIMessage:
    """AI message response with tool calling capabilities."""
    def __init__(self, content: str = "", tool_calls: List[Dict] = None):
        self.content = content
        self.tool_calls = tool_calls or []

class ChatOpenAI:
    """ChatOpenAI class with tool calling capabilities."""
    def __init__(self, temperature=0, model="gpt-3.5-turbo"):
        self.temperature = temperature
        self.model = model
        self.tools = []
    
    def bind_tools(self, tools):
        """Bind tools to the model for tool calling."""
        self.tools = tools
        return self
    
    def invoke(self, messages):
        """Mock invoke that simulates tool calling behavior."""
        if isinstance(messages, str):
            user_input = messages
        elif isinstance(messages, list) and len(messages) > 0:
            user_input = messages[-1].get('content', '') if isinstance(messages[-1], dict) else str(messages[-1])
        else:
            user_input = ""
        
        # Simulate tool calling decision based on input
        if "length" in user_input.lower() and "dog" in user_input.lower():
            return AIMessage(
                content="",  # Empty content when making tool calls (like real OpenAI API)
                tool_calls=[{
                    'name': 'get_text_length',
                    'args': {'text': 'DOG'},
                    'id': 'call_123',
                    'type': 'tool_call'
                }]
            )
        elif "length" in user_input.lower():
            # Extract text from user input for length calculation
            import re
            # Try multiple patterns to extract the word
            patterns = [
                r'length.*?(?:of|for).*?["\']([^"\']+)["\']',  # quoted text
                r'length.*?(?:of|for).*?(?:word|text).*?:\s*([A-Za-z]+)',  # word: WORD  
                r'length.*?(?:of|for).*?(?:word|text)\s+([A-Za-z]+)',  # word WORD
                r'(?:word|text)\s*:\s*([A-Za-z]+)',  # word: WORD
                r'length.*?:\s*([A-Za-z]+)',  # length: WORD
                r'\b([A-Z]+)\b',  # any uppercase word (fallback for DOG)
            ]
            
            text = "unknown"
            for pattern in patterns:
                text_match = re.search(pattern, user_input, re.IGNORECASE)
                if text_match:
                    text = text_match.group(1)
                    break
            
            return AIMessage(
                content="",  # Empty content when making tool calls (like real OpenAI API)
                tool_calls=[{
                    'name': 'get_text_length',
                    'args': {'text': text},
                    'id': 'call_124',
                    'type': 'tool_call'
                }]
            )

        else:
            return AIMessage(content="I can help you with text length calculations!")

# Tool definition (already provided for students)
def get_text_length(text: str) -> int:
    """Returns the length of a text by characters"""
    print(f"🔍 get_text_length called with text: {text}")
    text = text.strip("'\n").strip('"')  # Clean the text
    return len(text)

# Create tool instance (provided for students)
text_length_tool = Tool(
    name="get_text_length",
    description="Returns the length of a text by characters",
    func=get_text_length
)

def implement_set_api_key(api_key: str):
    """
    💡 **IMPLEMENT THIS FUNCTION**
    
    Set the OPENAI_API_KEY environment variable.
    
    Args:
        api_key (str): Your OpenAI API key
    """
    # Set environment variable for OpenAI API key
    if not api_key or not isinstance(api_key, str):
        raise ValueError("API key must be a non-empty string")
    os.environ["OPENAI_API_KEY"] = api_key

def implement_create_model_with_tools(tools: List[Tool]) -> ChatOpenAI:
    """
    💡 **IMPLEMENT THIS FUNCTION**
    
    Create a ChatOpenAI model and bind the provided tools to it.
    This replaces the old ReAct prompt-based approach!
    
    Args:
        tools (List[Tool]): List of tools to bind to the model
        
    Returns:
        ChatOpenAI: Model with tools bound for tool calling
    """
    if not isinstance(tools, list):
        raise ValueError("tools must be a list of Tool instances")
    model = ChatOpenAI(temperature=0)
    model = model.bind_tools(tools)
    return model

def implement_check_for_tool_calls(response: AIMessage) -> bool:
    """
    💡 **IMPLEMENT THIS FUNCTION**
    
    Check if the model response contains any tool calls.
    
    Args:
        response (AIMessage): The model's response
        
    Returns:
        bool: True if there are tool calls, False otherwise
    """
    return bool(response and getattr(response, 'tool_calls', None))

def implement_execute_tool_call(tool_call: Dict, available_tools: List[Tool]) -> str:
    """
    💡 **IMPLEMENT THIS FUNCTION**
    
    Execute a single tool call and return the result.
    
    Args:
        tool_call (Dict): Tool call information with 'name' and 'args'
        available_tools (List[Tool]): List of available tools
        
    Returns:
        str: The result of the tool execution
    """
    if not tool_call:
        raise ValueError("tool_call is required")
    name = tool_call.get('name')
    args = tool_call.get('args', {}) or {}
    if not name:
        raise ValueError("Tool call missing 'name'")
    # Find tool by name
    tool = next((t for t in available_tools if t.name == name), None)
    if tool is None:
        raise ValueError(f"Tool '{name}' not found among available tools")
    # For this exercise tools expect a single positional input maybe; handle dict for 'text'
    try:
        if isinstance(args, dict):
            if 'text' in args and len(args) == 1:
                result = tool.invoke(args['text'])
            else:
                # Pass entire args dict if tool expects it
                result = tool.invoke(args)
        else:
            result = tool.invoke(args)
    except Exception as e:
        raise RuntimeError(f"Error executing tool '{name}': {e}") from e
    return str(result)

def implement_run_agent_with_tool_calling(model_with_tools: ChatOpenAI, 
                                        user_input: str, 
                                        available_tools: List[Tool]) -> str:
    """
    💡 **IMPLEMENT THIS FUNCTION**
    
    Run the modern tool calling agent. This replaces the old ReAct loop!
    
    Args:
        model_with_tools (ChatOpenAI): Model with tools bound
        user_input (str): The user's question
        available_tools (List[Tool]): Available tools for execution
        
    Returns:
        str: The final answer
        
    Algorithm:
    1. Send user_input to the model
    2. Check if response has tool calls
    3. If yes: execute the tool call and return the result directly
    4. If no tool calls: return the model's content as final answer
    """
    if not isinstance(user_input, str):
        raise ValueError("user_input must be a string")
    # Send the user input to the model
    response = model_with_tools.invoke(user_input)
    # Check for tool calls
    if implement_check_for_tool_calls(response):
        # For simplicity, execute the first tool call (single tool scenario)
        results = []
        for tc in response.tool_calls:
            results.append(implement_execute_tool_call(tc, available_tools))
        # If only one result, return it directly
        return results[0] if len(results) == 1 else "\n".join(results)
    # No tool calls; return model content
    return response.content

# Test function (provided for students)
def check_api_key():
    """Check if OpenAI API key is set."""
    if "OPENAI_API_KEY" not in os.environ:
        raise Exception("❌ OPENAI_API_KEY environment variable is required!")
    print("✅ API key is set!")

print("🚀 Tool Calling Exercise - Student Version")
print("=" * 50)
print("📝 Implement the functions marked with 'IMPLEMENT THIS FUNCTION'")
print("🎯 Goal: Replace ReAct prompting with modern tool calling!")
print()

try:
    # Set up API key
    print("🔑 Setting up API key...")
    implement_set_api_key("demo_openai_key_12345")
    check_api_key()
    
    # Create model with tools
    print("🔧 Creating model with tool calling capabilities...")
    tools = [text_length_tool]
    model_with_tools = implement_create_model_with_tools(tools)
    
    # Test the agent
    print("🤖 Testing modern tool calling agent...")
    user_question = "What is the length of the word: DOG"
    result = implement_run_agent_with_tool_calling(model_with_tools, user_question, tools)
    
    print(f"📊 Final Result: {result}")
    print("\n🎉 Exercise completed! Check evaluate.py to test your solution.")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("💡 Make sure to implement all the required functions!") 