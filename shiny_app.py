import os
from typing import List, Dict, Any

from dotenv import load_dotenv
from shiny import App, render, ui

from rag_core import ask

load_dotenv()


def _format_sources(sources: List[Dict[str, Any]]) -> str:
    if not sources:
        return "📭 No specific sources found."
    
    lines: List[str] = []
    for i, s in enumerate(sources, 1):
        meta = s.get("metadata", {}) or {}
        parts = []
        
        # Extract key metadata with better formatting
        for k, icon in [("title", "📄"), ("file_path", "📁"), ("source", "🔗"), ("page", "📃"), ("page_number", "📃")]:
            if meta.get(k):
                parts.append(f"{icon} {k.replace('_', ' ').title()}: {meta[k]}")
        
        snippet = s.get("snippet") or s.get("page_content", "(no content preview)")
        if len(snippet) > 200:
            snippet = snippet[:200] + "..."
        
        metadata_info = "\n   ".join(parts) if parts else "📋 No metadata available"
        lines.append(f"🔸 **Source {i}:**\n   📝 Content: {snippet}\n   {metadata_info}")
    
    return "\n\n".join(lines)


# UI
app_ui = ui.page_fluid(
    ui.head_content(
        ui.tags.meta(name="viewport", content="width=device-width, initial-scale=1.0"),
        ui.tags.title("Insurance Act Chatbot"),
        ui.tags.style("""
        /* Import Tailwind CSS */
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        /* Global Variables */
        :root {
            --brand-1: #4f46e5;
            --brand-2: #7c3aed;
            --brand-3: #22d3ee;
            --ink-1: #111827;
            --ink-2: #374151;
            --ink-3: #6b7280;
        }
        
        /* Base Styles */
        * { box-sizing: border-box; }
        html, body { height: 100%; margin: 0; padding: 0; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            /* Light, futuristic SVG background (soft grid + dots + glows) */
            background-color: #f3f6fb; /* Fallback light */
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23ffffff'/%3E%3Cstop offset='1' stop-color='%23eef2f9'/%3E%3C/linearGradient%3E%3Cpattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M40 0H0V40' fill='none' stroke='%231a2b6e' stroke-opacity='0.06' stroke-width='1'/%3E%3C/pattern%3E%3Cpattern id='dots' width='28' height='28' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='2' cy='2' r='1.4' fill='%231a2b6e' fill-opacity='0.08'/%3E%3C/pattern%3E%3CradialGradient id='g1' cx='0.2' cy='0.1' r='0.6'%3E%3Cstop offset='0' stop-color='%236D28D9' stop-opacity='0.20'/%3E%3Cstop offset='1' stop-color='%23EEF2F9' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='g2' cx='0.85' cy='0.85' r='0.7'%3E%3Cstop offset='0' stop-color='%2322D3EE' stop-opacity='0.16'/%3E%3Cstop offset='1' stop-color='%23EEF2F9' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='1600' height='900' fill='url(%23bg)'/%3E%3Crect width='1600' height='900' fill='url(%23g1)'/%3E%3Crect width='1600' height='900' fill='url(%23g2)'/%3E%3Crect width='1600' height='900' fill='url(%23grid)'/%3E%3Crect width='1600' height='900' fill='url(%23dots)'/%3E%3C/svg%3E");
            background-attachment: fixed;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            color: var(--ink-1);
            line-height: 1.6;
            overflow-x: hidden;
        }
        
        /* Disable previous animated overlay to showcase SVG background */
        body::before { display: none; }
        
        /* Container */
        .main-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: saturate(120%) blur(20px);
            border-radius: 28px;
            box-shadow: 
                0 20px 40px rgba(0, 0, 0, 0.3),
                0 4px 12px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.4);
            margin: clamp(1rem, 3vh, 2.5rem) auto;
            max-width: 1200px;
            padding: clamp(1.5rem, 4vw, 3rem);
            border: 1px solid rgba(255, 255, 255, 0.4);
            position: relative;
            overflow: hidden;
            animation: containerFadeIn 0.8s ease-out;
        }
        
        .main-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
        }
        
        @keyframes containerFadeIn {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Header */
        .app-header {
            background: linear-gradient(135deg, var(--brand-1), var(--brand-2), var(--brand-3));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 900;
            font-size: clamp(2rem, 5vw, 3rem);
            text-align: center;
            margin-bottom: 2rem;
            letter-spacing: -0.02em;
            position: relative;
            animation: headerGlow 3s ease-in-out infinite alternate;
        }
        
        @keyframes headerGlow {
            from { filter: drop-shadow(0 0 10px rgba(79, 70, 229, 0.3)); }
            to { filter: drop-shadow(0 0 20px rgba(124, 58, 237, 0.5)); }
        }
        
        /* Question Container */
        .question-container {
            background: linear-gradient(145deg, rgba(248, 250, 252, 0.95), rgba(241, 245, 249, 0.9));
            border: 2px solid transparent;
            border-radius: 24px;
            padding: clamp(1.25rem, 3vw, 2rem);
            margin-bottom: 2rem;
            position: relative;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            background-clip: padding-box;
        }
        
        .question-container::before {
            content: '';
            position: absolute;
            inset: 0;
            padding: 2px;
            background: linear-gradient(135deg, var(--brand-1), var(--brand-2));
            border-radius: 24px;
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: exclude;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none; /* Do not block clicks */
            z-index: 0;
        }
        
        .question-container:focus-within::before {
            opacity: 1;
        }
        
        .question-container:focus-within {
            transform: translateY(-2px);
            box-shadow: 0 20px 40px rgba(79, 70, 229, 0.15);
        }
        
        /* Form Controls */
        .form-control, textarea, input[type="text"] {
            border: 1px solid rgba(226, 232, 240, 0.8) !important;
            background: rgba(255, 255, 255, 0.95) !important;
            font-size: 1.1rem !important;
            line-height: 1.7 !important;
            resize: vertical !important;
            font-weight: 400 !important;
            color: #111827 !important;
            padding: 1rem !important;
            border-radius: 12px !important;
            width: 100% !important;
            font-family: 'Inter', sans-serif !important;
            position: relative;
            z-index: 1; /* Above decorative overlay */
            caret-color: #4f46e5 !important;
            pointer-events: auto !important;
            user-select: text !important;
        }
        
        #question {
            border: 1px solid rgba(226, 232, 240, 0.8) !important;
            background: rgba(255, 255, 255, 0.95) !important;
            font-size: 1.1rem !important;
            line-height: 1.7 !important;
            resize: vertical !important;
            font-weight: 400 !important;
            color: #111827 !important;
            padding: 1rem !important;
            border-radius: 12px !important;
            width: 100% !important;
            font-family: 'Inter', sans-serif !important;
            min-height: 120px !important;
            position: relative;
            z-index: 1; /* Above decorative overlay */
            caret-color: #4f46e5 !important;
            pointer-events: auto !important;
            user-select: text !important;
        }
        
        .form-control:focus, textarea:focus, input[type="text"]:focus, #question:focus {
            outline: none !important;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15) !important;
            background: rgba(255, 255, 255, 1) !important;
            border-color: #4f46e5 !important;
        }
        
        .form-control::placeholder, textarea::placeholder, input[type="text"]::placeholder, #question::placeholder {
            color: #6b7280 !important;
            font-weight: 400 !important;
        }
        
        /* Ask Button */
        .ask-button {
            background: linear-gradient(135deg, var(--brand-1) 0%, var(--brand-2) 50%, var(--brand-3) 100%) !important;
            border: none !important;
            border-radius: 16px !important;
            padding: 14px 40px !important;
            font-weight: 700 !important;
            font-size: 1.1rem !important;
            color: white !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: 0 10px 30px rgba(79, 70, 229, 0.4) !important;
            position: relative !important;
            overflow: hidden !important;
        }
        
        .ask-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s ease;
        }
        
        .ask-button:hover::before {
            left: 100%;
        }
        
        .ask-button:hover {
            transform: translateY(-3px) scale(1.02) !important;
            box-shadow: 0 15px 40px rgba(79, 70, 229, 0.5) !important;
        }
        
        .ask-button:active {
            transform: translateY(-1px) scale(0.98) !important;
        }
        
        /* Results Grid */
        .results-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-top: 2rem;
        }
        
        @media (max-width: 968px) {
            .results-grid {
                grid-template-columns: 1fr;
                gap: 1.5rem;
            }
        }
        
        /* Result Sections */
        .result-section {
            background: rgba(255, 255, 255, 0.98);
            border-radius: 24px;
            padding: clamp(1.25rem, 3vw, 2rem);
            margin-bottom: 1.5rem;
            box-shadow: 
                0 15px 35px rgba(31, 41, 55, 0.08),
                0 3px 10px rgba(31, 41, 55, 0.03);
            border: 1px solid rgba(226, 232, 240, 0.8);
            position: relative;
            transition: all 0.3s ease;
            overflow: hidden;
        }
        
        .result-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--brand-1), var(--brand-2), var(--brand-3));
            border-radius: 24px 24px 0 0;
        }
        
        .result-section:hover {
            transform: translateY(-4px);
            box-shadow: 
                0 25px 50px rgba(31, 41, 55, 0.12),
                0 8px 25px rgba(31, 41, 55, 0.06);
        }
        
        /* Result Headers */
        .result-header {
            color: var(--ink-2);
            font-weight: 800;
            font-size: 1.3rem;
            margin-bottom: 1.25rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding-top: 0.5rem;
        }
        
        .result-header .emoji {
            font-size: 1.75rem;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }
        
        /* Content Areas */
        .result-content, #answer, #sources {
            background: linear-gradient(145deg, #f8fafc, #f1f5f9) !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 18px !important;
            padding: 1.5rem !important;
            font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace !important;
            font-size: 0.98rem !important;
            line-height: 1.8 !important;
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
            max-height: 480px;
            overflow-y: auto;
            transition: all 0.3s ease !important;
        }
        
        .result-content:hover, #answer:hover, #sources:hover {
            border-color: var(--brand-1) !important;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
        }
        
        /* Custom Scrollbar */
        .result-content::-webkit-scrollbar, #answer::-webkit-scrollbar, #sources::-webkit-scrollbar {
            width: 8px;
        }
        
        .result-content::-webkit-scrollbar-track, #answer::-webkit-scrollbar-track, #sources::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
        }
        
        .result-content::-webkit-scrollbar-thumb, #answer::-webkit-scrollbar-thumb, #sources::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, var(--brand-1), var(--brand-2));
            border-radius: 10px;
        }
        
        .result-content::-webkit-scrollbar-thumb:hover, #answer::-webkit-scrollbar-thumb:hover, #sources::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, var(--brand-2), var(--brand-3));
        }
        
        /* Footer */
        .footer {
            text-align: center;
            margin-top: 3rem;
            padding: 1.5rem;
            color: var(--ink-3);
            font-size: 0.9rem;
            font-weight: 500;
            background: rgba(248, 250, 252, 0.6);
            border-radius: 16px;
            border: 1px solid rgba(226, 232, 240, 0.5);
        }
        
        .footer .tech-badge {
            display: inline-block;
            margin: 0 0.25rem;
            padding: 0.25rem 0.5rem;
            background: linear-gradient(135deg, var(--brand-1), var(--brand-2));
            color: white;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 600;
            text-decoration: none;
            transition: transform 0.2s ease;
        }
        
        .footer .tech-badge:hover {
            transform: translateY(-2px);
        }
        
        /* Loading Animation */
        .loading-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .main-container {
                margin: 1rem;
                padding: 1.5rem;
                border-radius: 20px;
            }
            
            .app-header {
                font-size: 2.25rem;
                margin-bottom: 1.5rem;
            }
            
            .question-container {
                padding: 1.25rem;
                border-radius: 18px;
            }
            
            .result-section {
                padding: 1.25rem;
                border-radius: 18px;
            }
            
            .ask-button {
                width: 100% !important;
                margin-top: 1rem !important;
            }
        }
        
        @media (max-width: 480px) {
            .app-header {
                font-size: 1.875rem;
            }
            
            .result-content, #answer, #sources {
                font-size: 0.9rem !important;
                padding: 1.25rem !important;
            }
        }
        
        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
        """)
    ),
    ui.div(
        {"class": "main-container"},
        ui.h1("🛡️ Insurance Act Chatbot", {"class": "app-header"}),
        
        # Question input section
        ui.div(
            {"class": "question-container"},
            ui.input_text_area(
                "question", 
                label=None,
                placeholder="Ask me anything about the Insurance Act... (e.g., 'What are the penalties for non-compliance?')",
                rows=4,
                width="100%"
            ),
            ui.div(
                {"class": "mt-4 text-center"},
                ui.input_action_button(
                    "ask", 
                    "✨ Ask Question", 
                    class_="ask-button",
                    style="min-width: 200px;"
                )
            )
        ),
        
        # Results section
        ui.div(
            {"class": "results-grid"},
            
            # Answer section
            ui.div(
                {"class": "result-section"},
                ui.div(
                    {"class": "result-header"},
                    ui.span("💡", {"class": "emoji"}),
                    ui.span("Answer")
                ),
                                                ui.output_text_verbatim("answer", placeholder=True),
                                ui.tags.script("""
                                // Ensure form controls work properly
                                document.addEventListener('DOMContentLoaded', function() {
                                    function ensureTextareaWorks() {
                                        // Apply styling to output elements
                                        document.querySelectorAll('#answer, #sources').forEach(el => {
                                            el.classList.add('result-content');
                                        });
                                        
                                        // Fix textarea functionality
                                        const textarea = document.getElementById('question');
                                        if (textarea) {
                                            // Remove any attributes that might block input
                                            textarea.removeAttribute('readonly');
                                            textarea.removeAttribute('disabled');
                                            textarea.removeAttribute('contenteditable');
                                            
                                            // Ensure proper styling and behavior
                                            textarea.style.pointerEvents = 'auto';
                                            textarea.style.userSelect = 'text';
                                            textarea.style.cursor = 'text';
                                            textarea.style.webkitUserSelect = 'text';
                                            textarea.style.mozUserSelect = 'text';
                                            
                                            // Force focus capability
                                            textarea.tabIndex = 0;
                                            
                                            // Test if textarea is working
                                            console.log('Textarea setup complete:', {
                                                id: textarea.id,
                                                disabled: textarea.disabled,
                                                readonly: textarea.readOnly,
                                                value: textarea.value
                                            });
                                        }
                                    }
                                    
                                    // Run immediately and after delays to handle Shiny's rendering
                                    ensureTextareaWorks();
                                    setTimeout(ensureTextareaWorks, 100);
                                    setTimeout(ensureTextareaWorks, 500);
                                    setTimeout(ensureTextareaWorks, 1000);
                                    setTimeout(ensureTextareaWorks, 2000);
                                    
                                    // Re-run when Shiny updates
                                    document.addEventListener('shiny:value', ensureTextareaWorks);
                                    document.addEventListener('shiny:bound', ensureTextareaWorks);
                                });
                                """)
            ),
            
            # Sources section  
            ui.div(
                {"class": "result-section"},
                ui.div(
                    {"class": "result-header"},
                    ui.span("📚", {"class": "emoji"}),
                    ui.span("Sources & References")
                ),
                ui.output_text_verbatim("sources", placeholder=True)
            )
        ),
        
        # Enhanced Footer
        ui.div(
            {"class": "footer"},
            ui.p([
                "🚀 Powered by ",
                ui.a("LangChain", href="#", class_="tech-badge"),
                " • ",
                ui.a("Pinecone", href="#", class_="tech-badge"),  
                " • ",
                ui.a("OpenAI", href="#", class_="tech-badge"),
                " • ",
                ui.a("Shiny for Python", href="#", class_="tech-badge")
            ])
        )
    )
)


def server(input, output, session):
    
    @output
    @render.text
    def answer():
        if input.ask() == 0:
            return "👋 Welcome! Ask me anything about the Insurance Act and I'll provide detailed answers with sources.\n\nTry questions like:\n• What are the key provisions of the Insurance Act?\n• What penalties apply for non-compliance?\n• How are insurance companies regulated?"
        
        q = (input.question() or "").strip()
        if not q:
            return "❓ Please enter a question in the text box above, then click 'Ask Question'."
        
        try:
            print(f"DEBUG: Processing question: '{q}'")
            result = ask(q)
            answer_text = result.get("answer", "❌ No answer received from the system.")
            print(f"DEBUG: Got answer with length: {len(answer_text)}")
            return f"💡 {answer_text}"
        except Exception as e:
            print(f"DEBUG: Error occurred: {e}")
            return f"❌ Error processing your question:\n\n{str(e)}\n\nPlease check your environment variables and try again."

    @output
    @render.text
    def sources():
        if input.ask() == 0:
            return "📚 Sources and references from the Insurance Act documents will appear here after you ask a question.\n\nThis helps you verify the information and explore the original documents."
        
        q = (input.question() or "").strip()
        if not q:
            return "🔍 No sources available - please ask a question first."
        
        try:
            result = ask(q)
            sources_list = result.get("sources", [])
            if not sources_list:
                return "📝 No specific sources found for this query, but the answer is based on the Insurance Act knowledge base."
            
            formatted_sources = _format_sources(sources_list)
            print(f"DEBUG: Got {len(sources_list)} sources")
            return f"📖 Found {len(sources_list)} relevant source(s):\n\n{formatted_sources}"
        except Exception as e:
            return f"⚠️ Error retrieving sources:\n{type(e).__name__}: {str(e)}\n\nPlease check your configuration:\n• OPENAI_API_KEY\n• PINECONE_API_KEY2\n• INDEX_NAME2"


app = App(app_ui, server)

if __name__ == "__main__":
    # Run via `python -m shiny run --host 0.0.0.0 --port 7861 shiny_app.py`
    # Keeping main guard for direct runs if desired in some environments.
    from shiny import run_app

    run_app(app, host="0.0.0.0", port=int(os.getenv("PORT", "7861")))
