import { useEffect, useMemo, useRef, useState } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Message({ role, text }) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} w-full`}> 
      <div className={`${role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} rounded-2xl px-4 py-3 shadow-sm max-w-[80%]`}>{text}</div>
    </div>
  )
}

function IntentCard({ data }) {
  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <div className="text-sm text-gray-500">Intent</div>
      <div className="font-semibold">{data.intent}</div>
      <div className="text-sm text-gray-500 mt-2">Confidence</div>
      <div className="font-medium">{Math.round(data.confidence * 100)}%</div>
      {data.slots && Object.keys(data.slots).length > 0 && (
        <div className="mt-2">
          <div className="text-sm text-gray-500">Slots</div>
          <ul className="text-sm text-gray-700 list-disc pl-5">
            {Object.entries(data.slots).map(([k, v]) => (
              <li key={k}>
                <span className="font-medium">{k}:</span> {v ?? '—'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I can search flights, book hotels, check weather, and cancel bookings. How can I help?' }
  ])
  const [input, setInput] = useState('Find flights from NYC to Paris on 6/5')
  const [lastNlu, setLastNlu] = useState(null)
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text) return
    setMessages(m => [...m, { role: 'user', text }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
      const data = await res.json()
      setLastNlu(data)
      setMessages(m => [...m, { role: 'assistant', text: data.reply }])
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', text: 'Sorry, something went wrong contacting the server.' }])
    } finally {
      setLoading(false)
    }
  }

  const exampleQueries = useMemo(() => ([
    'Hi there',
    'Find flights from London to Rome next Friday',
    'Book a hotel in Tokyo from 7/1 to 7/5',
    'Cancel booking ABC123',
    "What's the weather in Paris tomorrow?",
  ]), [])

  return (
    <div className="w-full grid md:grid-cols-5 gap-6">
      <div className="md:col-span-3 h-[70vh] bg-gradient-to-b from-blue-50 to-purple-50 rounded-2xl p-4 flex flex-col">
        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto pr-2">
          {messages.map((m, i) => <Message key={i} role={m.role} text={m.text} />)}
          {loading && <div className="text-xs text-gray-500">Thinking…</div>}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            className="flex-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="Type your travel request..."
          />
          <button onClick={send} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">Send</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {exampleQueries.map(q => (
            <button key={q} onClick={() => setInput(q)} className="text-xs px-2 py-1 rounded-full bg-white border hover:bg-gray-50">{q}</button>
          ))}
        </div>
      </div>
      <div className="md:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow">
          <div className="font-semibold mb-2">Detected Intent</div>
          {lastNlu ? <IntentCard data={lastNlu} /> : <div className="text-sm text-gray-500">Ask something to see the intent, confidence, and slots.</div>}
        </div>
        <IntentCatalog />
      </div>
    </div>
  )
}

function IntentCatalog() {
  const [intents, setIntents] = useState([])
  useEffect(() => {
    fetch(`${BACKEND}/intents`).then(r => r.json()).then(setIntents).catch(() => {})
  }, [])
  return (
    <div className="bg-white rounded-2xl p-4 shadow">
      <div className="font-semibold mb-2">Available Commands</div>
      <div className="grid gap-3">
        {intents.map((it) => (
          <div key={it.name} className="border rounded-xl p-3">
            <div className="font-medium">{it.name}</div>
            <div className="text-sm text-gray-600">{it.description}</div>
            {it.sample_utterances?.length > 0 && (
              <ul className="list-disc pl-5 mt-1 text-sm text-gray-700">
                {it.sample_utterances.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold">Travel Chatbot Playground</h1>
        <p className="text-gray-600 mt-1">Type a request. The assistant will detect your intent and show extracted details.</p>
        <div className="mt-6">
          <Chat />
        </div>
      </div>
    </div>
  )
}
