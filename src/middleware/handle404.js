/**
 * middleware/handle404.js
 */
import 'dotenv/config'

const handle404 = (req, res) => {
  const delay = Number(process.env.DELAY404) || 1000
  setTimeout(() => res.sendStatus(404), Math.ceil(Math.random() * delay))
}

export { handle404 }
