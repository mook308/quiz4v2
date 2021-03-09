import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import fs from 'fs'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { body, query, validationResult } from 'express-validator'
import { type } from 'os'



const app = express()
app.use(bodyParser.json())
app.use(cors())

const PORT = process.env.PORT || 3000
const SECRET = "SIMPLE_SECRET"

interface DbSchema {
  users : UserLegacy[]
  balances: Balances
}
interface UserLegacy {
  username: string;
  password: string;
  firstname: string; // ชื่อของผู้ใช้
  lastname: string; //นามสกุลของผู้ใช้
  balance: number;// จำนวนเงินในบัญชีเริ่มต้น

}
interface Balance {
  name: string;
  balance: number ;
}

interface Balances{
  [username:string]: Balance[]
}

interface JWTPayload {
  username: string;
  password: string;
}


const readDbFile = (): DbSchema => {
  const raw = fs.readFileSync('db.json', 'utf8')
  const db: DbSchema = JSON.parse(raw)
  return db
}


app.get('/',(req,res)=>{
  res.send("hello !!!")
});

type LoginArgs = Pick<UserLegacy, 'username' | 'password'>
app.post<any,any,LoginArgs>('/login',
  (req, res) => {

    const { username, password } = req.body
    const db = readDbFile()
    const user = db.users.find(user => user.username === username)
    // Use username and password to create token.
    if (!user || !bcrypt.compareSync(password, user.password)) {
      res.status(400)
      res.json({ message: 'Invalid username or password' })
      return
    }
    const token = jwt.sign({ username: user.username, password: user.password } as JWTPayload, SECRET)
    return res.status(200).json({
      message: 'Login succesfully',
      token: token,
      
    })
  })

  type RegisterArgs = Pick<UserLegacy, 'username' | 'password'| 'firstname' | 'lastname' | 'balance'>
  
app.post<any,any,RegisterArgs>('/register',
  (req, res) => {

    const { username, password, firstname, lastname, balance } = req.body
    const db = readDbFile()
    const user = db.users.find(user => user.username === username)
    const hashPassword = bcrypt.hashSync(password, 10)
    if(user){
      res.status(400)
      res.json({message: 'Username is already in used'})
      return
    }
    db.users.push({
      ...body,
      username: username,
      password: hashPassword,
      firstname: firstname,
      lastname: lastname,
      balance: balance,
    })
    fs.writeFileSync('db.json', JSON.stringify(db))
    res.json({ message: 'Register successfully' })

  })

app.get('/balance',
  (req, res) => {
    const token = req.query.token as string
    try {
      const { username } = jwt.verify(token, SECRET) as JWTPayload
      const db = readDbFile()
      const bn = db.balances[username] || []
      
      res.json(bn)
  
    }
    catch (e) {
      //response in case of invalid token
      res.status(401)
      res.json({ message: 'Invalid token' })
    }
  })

app.post('/deposit',
  body('amount').isInt({ min: 1 }),
  (req, res) => {

    const token = req.query?.token as string

    try {
      const { username } = jwt.verify(token, SECRET) as JWTPayload
      const db = readDbFile()
      const bn = db.balances[username] || []
      
      res.json(bn)
  
    }
    catch (e) {
      //response in case of invalid token
      res.status(401)
      res.json({ message: 'Invalid token' })
    }

    //Is amount <= 0 ?
    if (!validationResult(req).isEmpty())
      return res.status(400).json({ message: "Invalid data" })
  })

app.post('/withdraw',
  (req, res) => {
    const token = req.query?.token as string

    try {
      const { username } = jwt.verify(token, SECRET) as JWTPayload
      const db = readDbFile()
      const bn = db.balances[username] || []
      
      res.json(bn)
  
    }
    catch (e) {
      //response in case of invalid token
      res.status(401)
      res.json({ message: 'Invalid token' })
    }

  })

app.delete('/reset', (req, res) => {
  
  //code your database reset here
  const db = readDbFile()
  const data = db.users.filter(datas => datas == null)
  db.users = data
  fs.writeFileSync('db.json', JSON.stringify(db))
  return res.status(200).json({
    message: 'Reset database successfully'
  })
})

app.get('/me', (req, res) => {
  return res.status(200).json({
    firstname: "กฤตมุข",
    lastname : "ขันติพงษ์",
    code: 620610773,
    gpa : 2.92
  })
})

app.get('/demo', (req, res) => {
  return res.status(200).json({
    message: 'This message is returned from demo route.'
  })
})

app.listen(PORT, () => console.log(`Server is running at ${PORT}`))