"""
LangChain and LangGraph Course - Main Entry Point

This module serves as the main entry point for the AI agents course using LangChain and LangGraph.
"""

from dotenv import load_dotenv
import os


def main():
    """Main function to run the LangChain and LangGraph course examples."""
    # Load environment variables from .env file
    load_dotenv()
    
    print("🚀 Welcome to the LangChain & LangGraph Course!")
    print("=" * 50)
    
    # Check if required environment variables are set
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  Warning: OPENAI_API_KEY not found in environment variables.")
        print("   Please create a .env file and add your OpenAI API key:")
        print("   OPENAI_API_KEY=your_api_key_here")
    else:
        print("✅ OpenAI API key found!")
    
    print("\n📚 Course modules ready for development:")
    print("   - LangChain basics")
    print("   - LangGraph workflows")
    print("   - AI Agent development")
    print("\n🔧 Environment setup complete!")


if __name__ == "__main__":
    main()
