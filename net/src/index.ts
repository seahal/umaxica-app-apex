import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello 2 Hono!')
})

export default app
