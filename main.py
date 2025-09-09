"""
LangChain and LangGraph Course - Main Entry Point

This module serves as the main entry point for the AI agents course using LangChain and LangGraph.
"""

from dotenv import load_dotenv
load_dotenv()

from langchain import hub
from langchain.agents import AgentExecutor
from langchain.agents.react.agent import create_react_agent
from langchain_openai import ChatOpenAI
from langchain_tavily import TavilySearch

tools = [TavilySearch()]

llm = ChatOpenAI(model="gpt-4", temperature=0)

react_prompt = hub.pull("hwchase17/react")

agent = create_react_agent(
    llm=llm, 
    tools=tools, 
    prompt=react_prompt)

agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
chain = agent_executor

def main():
    results = chain.invoke(
        input={
            "input": "Search for 3 job postings for an data scientist using langchain in Nairobi, Kenya on LinkedIn together with the links and summarize them in a table with the job title, company name, location, and a brief description."
        }
    )
    
if __name__ == "__main__":
    main()
