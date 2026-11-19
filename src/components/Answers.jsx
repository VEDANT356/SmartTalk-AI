
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

const Answer = ({ question, answer, time }) => {
  const copyToClipboard = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch (error) {
      toast.error("Unable to copy text");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 space-y-5">

      {question && (
        <div className="flex justify-end">
          <div className="max-w-[85%]">

            <div className="flex justify-end items-center gap-2 mb-2">
              <span className="text-xs text-zinc-400">
                You
              </span>
              <span className="text-xl">👤</span>
            </div>

            <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-sm break-words">
              {question}
            </div>

            <div className="flex justify-end mt-2">
              <button
                onClick={() => copyToClipboard(question, "Question copied!")}
                className="text-zinc-400 hover:text-white text-sm transition"
                title="Copy question"
              >
                ⧉ Copy
              </button>
            </div>

          </div>
        </div>
      )}

      <div className="flex justify-start">
        <div className="w-full min-w-0">

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🤖</span>
            <span className="font-semibold text-white">
              SmartTalk
            </span>
          </div>

          <div className="bg-zinc-800 text-zinc-100 p-4 md:p-5 rounded-2xl rounded-tl-sm max-w-full overflow-hidden">

            <div className="prose prose-invert max-w-none break-words
              prose-headings:font-bold
              prose-headings:text-white
              prose-p:text-zinc-200
              prose-strong:text-white
              prose-a:text-blue-400
              prose-a:no-underline
              hover:prose-a:underline
              prose-li:text-zinc-200
              prose-blockquote:border-blue-500
              prose-blockquote:text-zinc-300
              prose-hr:border-zinc-600
              prose-table:border-collapse
              prose-th:border
              prose-th:border-zinc-600
              prose-th:bg-zinc-700
              prose-th:p-2
              prose-td:border
              prose-td:border-zinc-600
              prose-td:p-2
            ">

              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    return (
                      <code
                        className={`bg-zinc-900 text-blue-300 px-1.5 py-1 rounded text-sm font-mono ${className || ""}`}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },

                  pre({ children }) {
                    const codeText = String(
                      children?.props?.children || ""
                    );

                    return (
                      <div className="relative my-4 rounded-xl overflow-hidden border border-zinc-600 bg-zinc-950">

                        <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                          <span className="text-xs text-zinc-400">
                            Code
                          </span>

                          <button
                            onClick={() =>
                              copyToClipboard(codeText, "Code copied!")
                            }
                            className="text-xs text-zinc-300 hover:text-white transition"
                          >
                            ⧉ Copy Code
                          </button>
                        </div>

                        <pre className="p-4 overflow-x-auto text-sm text-green-300 font-mono">
                          {children}
                        </pre>

                      </div>
                    );
                  },

                  a({ children, href, ...props }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {answer || ""}
              </ReactMarkdown>

            </div>

          </div>

          <div className="flex items-center gap-4 mt-3">

            <span className="text-xs text-zinc-500">
              {time}
            </span>

            <button
              onClick={() => copyToClipboard(answer, "Answer copied!")}
              disabled={!answer || answer === "Thinking..."}
              className="text-zinc-400 hover:text-white text-sm transition disabled:opacity-40"
              title="Copy answer"
            >
              ⧉ Copy Answer
            </button>

          </div>

        </div>
      </div>

    </div>
  );
};

export default Answer;
