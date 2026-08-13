/**
 * middleware/handle404.js
 */
import 'dotenv/config'

const handle404 = (req, res) => {
  setTimeout(() => {
    res.sendStatus(404)
  }, Math.ceil(Math.random() * Number(process.env.DELAY404)))
}

export { handle404 }
