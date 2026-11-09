import { useState, useEffect } from 'react'
import {
  FileText,
  MessageSquare,
  LayoutDashboard,
  Settings,
  Plus,
  Upload,
  Send,
  Bot,
  User,
  Trash2,
  Sparkles,
  Menu,
} from 'lucide-react'

function App() {
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [uploadedSource, setUploadedSource] = useState('')

  useEffect(() => {
    const restoreLatestPDF = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/upload/documents')
        const data = await response.json(); console.log('DOCUMIND CHAT RESPONSE:', data)

        if (response.ok && data.documents?.length > 0) {
          const latestPDF = [...data.documents].sort(
            (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
          )[0]

          setUploadedSource(latestPDF.filename)
          setUploaded(true)
        }
      } catch (error) {
        console.error('Could not restore uploaded PDF:', error)
      }
    }

    restoreLatestPDF()
  }, [])


  const validatePDF = (selectedFile) => {
    if (!selectedFile || selectedFile.type !== 'application/pdf') {
      alert('Please select a valid PDF file.')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('PDF size must not exceed 10 MB.')
      return
    }

    setFile(selectedFile)
    setUploaded(false)
    setUploadedSource('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    validatePDF(e.dataTransfer.files[0])
  }

  const handleUpload = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append('pdf', file)

    try {
      setUploading(true)

      const response = await fetch('http://localhost:5000/api/upload/pdf', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json(); console.log('DOCUMIND CHAT RESPONSE:', data)

      if (!response.ok) {
        throw new Error(data.message || 'PDF upload failed.')
      }

      setUploaded(true)

      setUploadedSource(data.filename)
      alert(`PDF uploaded successfully! ${data.chunkCount} chunks stored.`)
    } catch (error) {
      alert(error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSend = async () => {
    if (!message.trim() || loading) return

    if (!uploadedSource) {
      alert('Please upload a PDF before asking questions.')
      return
    }

    const question = message.trim()

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: question },
    ])
    setMessage('')

    try {
      setLoading(true)

      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          source: uploadedSource,
        }),
      })

      const data = await response.json(); console.log('DOCUMIND CHAT RESPONSE:', data)

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get an answer.')
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources || [],
        },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error.message}`,
          sources: [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">

      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-900 p-5 md:flex">
        <h1 className="mb-10 flex items-center gap-2 text-xl font-bold">
          <FileText className="text-blue-400" />
          DocuMind AI
        </h1>

        <button
          onClick={() => {
            setMessages([])
            setMessage('')
          }}
          className="mb-8 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium hover:bg-blue-700"
        >
          <Plus size={18} />
          New Chat
        </button>

        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Workspace
        </p>

        <nav className="space-y-2">
          <button className="flex w-full items-center gap-3 rounded-lg bg-slate-800 px-3 py-3 text-left text-blue-400">
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-slate-400 hover:bg-slate-800">
            <FileText size={19} />
            My Documents
          </button>

          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-slate-400 hover:bg-slate-800">
            <MessageSquare size={19} />
            Chat History
          </button>
        </nav>

        <div className="mt-auto">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-slate-400 hover:bg-slate-800">
            <Settings size={19} />
            Settings
          </button>

          <div className="mt-5 flex items-center gap-3 border-t border-slate-800 pt-5">
            <div className="rounded-full bg-blue-600 p-2">
              <User size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">My Workspace</p>
              <p className="text-xs text-slate-500">Free Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <Menu className="text-slate-400 md:hidden" />
            <h2 className="text-lg font-semibold">Dashboard</h2>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2">
            <Sparkles size={16} className="text-blue-400" />
            <span className="text-sm text-slate-300">AI Powered</span>
          </div>
        </header>

        <div className="mx-auto max-w-5xl p-6 md:p-10">
          <h1 className="text-3xl font-bold">
            Welcome to DocuMind AI
          </h1>

          <p className="mt-2 text-slate-400">
            Upload your documents and get instant answers using AI.
          </p>

          {/* Upload Section */}
          <div className="mt-10 rounded-2xl border border-slate-700 bg-slate-900 p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-3">
                <Upload className="text-blue-400" />
              </div>

              <div>
                <h3 className="font-semibold">Upload your PDF</h3>
                <p className="text-sm text-slate-400">
                  Add a document to start chatting
                </p>
              </div>
            </div>

            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-700 px-5 py-12 text-center transition hover:border-blue-500 hover:bg-slate-800/50"
            >
              <Upload size={35} className="mb-4 text-blue-400" />

              <p className="font-medium">
                {file ? file.name : uploadedSource ? uploadedSource.replace(/^\\d+-/, '').replace(/_/g, ' ') : 'Click to browse your files'}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                PDF documents only (Maximum 10 MB)
              </p>

              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  validatePDF(e.target.files[0])
                  e.target.value = ''
                }}
              />
            </label>

            {(file || uploadedSource) && (
              <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-800 p-3">
                <div className="flex items-center gap-3">
                  <FileText className="text-blue-400" />
                  <div>
                    <p className="text-sm font-medium">{file ? file.name : uploadedSource.replace(/^\\d+-/, '').replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400">
                      {file ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Saved PDF'}
                    </p>
                  </div>
                </div>

                <button onClick={() => {
                  setFile(null)
                  setUploaded(false)
                  setUploadedSource('')
                }}>
                  <Trash2 size={18} className="text-red-400" />
                </button>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {uploading ? 'Uploading...' : uploaded ? 'Upload Again' : 'Upload Document'}
            </button>

            {uploaded && (
              <p className="mt-3 text-sm text-green-400">
                PDF uploaded and processed successfully.
              </p>
            )}
          </div>

          {/* Chat Section */}
          <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <div className="mb-6 flex items-center gap-3">
              <Bot className="text-blue-400" size={25} />
              <div>
                <h3 className="font-semibold">AI Document Assistant</h3>
                <p className="text-sm text-slate-500">
                  Ask questions about your uploaded documents
                </p>
              </div>
            </div>

            <div className="flex min-h-40 max-h-[500px] flex-col gap-4 overflow-y-auto py-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare size={35} className="mb-3 text-slate-600" />
                  <p className="font-medium text-slate-300">
                    Start a conversation
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Upload a PDF to ask questions about its content.
                  </p>
                </div>
              )}

              {messages.map((item, index) => (
                <div
                  key={index}
                  className={`max-w-[90%] rounded-xl p-4 ${
                    item.role === 'user'
                      ? 'self-end bg-blue-600'
                      : 'self-start border border-slate-700 bg-slate-800'
                  }`}
                >
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-300">
                    {item.role === 'user' ? 'You' : 'DocuMind AI'}
                  </p>

                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {item.content}
                  </p>

                  {item.sources?.length > 0 && (
                    <div className="mt-3 border-t border-slate-600 pt-2">
                      <p className="mb-1 text-xs font-semibold text-slate-400">
                        Sources
                      </p>
                       {item.sources.map((source, sourceIndex) => (
  <div
    key={sourceIndex}
    className="mb-2 flex items-center gap-2 text-xs text-blue-300"
  >
    <FileText size={14} />
    <span>
      {source.filename} â€” Chunk {source.chunkIndex}
    </span>
  </div>
))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <p className="self-start text-sm text-blue-400">
                  DocuMind AI is thinking...
                </p>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex gap-3 border-t border-slate-800 pt-5"
            >
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask something about your document..."
                className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={!message.trim() || loading}
                className="rounded-lg bg-blue-600 px-4 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={19} />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
















