import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono()

app.use('*', async (c, next) => {
  const currentYear = new Date().getUTCFullYear()
  c.set('currentYear', currentYear)
  await next()
})

app.use(renderer)

app.get('/', (c) => {
  return c.render(
    <div class="space-y-4">
      <h2 class="text-3xl font-semibold text-gray-800">About this site.</h2>
      <p>This domain (<a href='https://umaxica.net'>umaxica.net</a>) is not operated as a public-facing website.
For access to our services, we kindly request that you visit our official website at <a href='https://umaxica.app'>umaxica.app</a></p>
      <p>本ドメイン（<a href='https://umaxica.net'>umaxica.net</a>）は、一般向けのウェブサイトとして運用いたしておりません。
弊社サービスの利用につきましては、<a href='https://umaxica.com'>umaxica.app</a> の公式ウェブサイトへごアクセス賜りますようお願い申し上げます。</p>
    </div>
  )
})

export default app
