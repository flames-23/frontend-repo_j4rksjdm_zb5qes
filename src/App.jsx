import { useEffect, useMemo, useState } from 'react'

const API_URL = import.meta.env.VITE_BACKEND_URL || ''

function Header({ onSearch }) {
  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-black text-white grid place-items-center font-bold">MK</div>
          <span className="font-semibold tracking-wide">MK Clothing</span>
        </div>
        <input
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search products..."
          className="w-72 max-w-[50vw] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black/30"
        />
      </div>
    </header>
  )
}

function ProductCard({ p, addToCart }) {
  return (
    <div className="group bg-white rounded-xl border shadow-sm hover:shadow-md transition overflow-hidden">
      {p.image && (
        <img src={p.image} alt={p.title} className="h-48 w-full object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 group-hover:underline line-clamp-2">{p.title}</h3>
          <span className="font-bold">${p.price.toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{p.description}</p>
        <div className="mt-3 flex items-center gap-2">
          <select className="border rounded px-2 py-1 text-sm">
            {(p.sizes || ["S","M","L"]).map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button onClick={() => addToCart(p)} className="ml-auto bg-black text-white px-3 py-1.5 rounded-md text-sm hover:bg-gray-900">Add</button>
        </div>
      </div>
    </div>
  )
}

function Cart({ items, onCheckout, onRemove }) {
  const total = useMemo(() => items.reduce((sum, i) => sum + i.price, 0), [items])
  return (
    <aside className="sticky top-16 bg-white border rounded-xl p-4 h-fit">
      <h4 className="font-semibold mb-2">Your Cart</h4>
      {items.length === 0 ? (
        <p className="text-sm text-gray-600">No items yet</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm">
              <img src={it.image} alt="" className="w-10 h-10 object-cover rounded" />
              <span className="flex-1 line-clamp-1">{it.title}</span>
              <span className="font-medium">${it.price.toFixed(2)}</span>
              <button className="text-red-500 text-xs" onClick={() => onRemove(idx)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex items-center justify-between">
        <span className="font-semibold">Total</span>
        <span className="font-bold">${total.toFixed(2)}</span>
      </div>
      <button disabled={!items.length} onClick={onCheckout} className="mt-3 w-full bg-black disabled:opacity-50 text-white py-2 rounded-md">Checkout</button>
    </aside>
  )
}

function App() {
  const [products, setProducts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`${API_URL}/products`)
        if (!res.ok) throw new Error('Failed to load products')
        const data = await res.json()
        setProducts(data)
        setFiltered(data)
      } catch (e) {
        setError('Unable to fetch products. Try clicking Seed Demo Data below.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const addToCart = (p) => setCart(prev => [...prev, p])
  const removeFromCart = (idx) => setCart(prev => prev.filter((_, i) => i !== idx))

  const onSearch = (q) => {
    const t = q.toLowerCase()
    setFiltered(products.filter(p => `${p.title} ${p.description || ''}`.toLowerCase().includes(t)))
  }

  const seedDemo = async () => {
    await fetch(`${API_URL}/seed`, { method: 'POST' })
    const res = await fetch(`${API_URL}/products`)
    const data = await res.json()
    setProducts(data)
    setFiltered(data)
  }

  const checkout = async () => {
    if (!cart.length) return
    const order = {
      items: cart.map(c => ({ product_id: c.id, title: c.title, price: c.price, quantity: 1, size: (c.sizes||[])[0] || null, image: c.image })),
      customer: { name: 'Guest', email: 'guest@example.com', address: 'N/A' },
      total: cart.reduce((s, i) => s + i.price, 0),
      status: 'pending'
    }
    const res = await fetch(`${API_URL}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) })
    if (res.ok) {
      setCart([])
      alert('Order placed!')
    } else {
      alert('Checkout failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-gray-100">
      <Header onSearch={onSearch} />

      <main className="max-w-6xl mx-auto p-4 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">New Arrivals</h2>
            <div className="flex items-center gap-2">
              <button onClick={seedDemo} className="text-sm px-3 py-1.5 rounded border">Seed Demo Data</button>
              <a href={`${API_URL}/test`} target="_blank" className="text-sm text-blue-600 underline">Backend Status</a>
            </div>
          </div>

          {loading && <p>Loading products...</p>}
          {error && <p className="text-red-600">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <ProductCard key={p.id} p={p} addToCart={addToCart} />)
            )}
          </div>
        </div>
        <Cart items={cart} onCheckout={checkout} onRemove={removeFromCart} />
      </main>

      <footer className="border-t mt-8">
        <div className="max-w-6xl mx-auto p-4 text-sm text-gray-600 flex justify-between">
          <span>© {new Date().getFullYear()} MK Clothing</span>
          <span>Powered by Flames</span>
        </div>
      </footer>
    </div>
  )
}

export default App
