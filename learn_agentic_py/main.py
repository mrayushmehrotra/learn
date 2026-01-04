import os

from dotenv import load_dotenv
from langchain_classic.agents import AgentExecutor, create_react_agent
from langchain_core.tools import Tool
from langchain_community.tools import DuckDuckGoSearchRun

from langchain_groq import ChatGroq

load_dotenv()

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.7,
)

search_tool = Tool(
    name="search",
    func=DuckDuckGoSearchRun().run,
    description="Search the web for up-to-date information",
)

tools = [search_tool]

from langchain_classic import hub

prompt = hub.pull("hwchase17/react")at 

agent = create_react_agent(llm, tools, prompt)

agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    handle_parsing_errors=True,
)

if __name__ == "__main__":
    while True:
        question = input("\nAsk a question (or 'quit'): ")
        if question.lower() == "quit":
            break

        response = agent_executor.invoke({"input": question})

        print("\nAnswer:", response["output"])
