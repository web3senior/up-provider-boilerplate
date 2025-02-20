import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { useUpProvider } from './../contexts/UpProvider'
import party from 'party-js'
import ABI from './../abi/Counter.json'
import toast, { Toaster } from 'react-hot-toast'
import Web3 from 'web3'
import Hero from './../assets/hero.svg'
import styles from './Home.module.scss'

function Home() {
  const [count, setCounter] = useState(0)
  const auth = useUpProvider()
  const web3 = new Web3(auth.provider)
  const contract = new web3.eth.Contract(ABI, import.meta.env.VITE_CONTRACT)

  const getCount = async () => await contract.methods.get().call()

  const inc = async (e) => {
    const t = toast.loading(`Waiting for transaction's confirmation`)

    try {
      contract.methods
        .inc()
        .send({
          from: auth.accounts[0],
        })
        .then((res) => {
          console.log(res)

          toast.success(`Done`)
          toast.dismiss(t)

          party.confetti(document.body, {
            count: party.variation.range(20, 40),
          })
        })
        .catch((error) => {
          console.log(error)
          toast.dismiss(t)
        })
    } catch (error) {
      console.log(error)
      toast.dismiss(t)
    }
  }

  useEffect(() => {
    getCount().then((res) => {
      console.log(res)
      setCounter(res)
    })
  }, [])

  return (
    <div className={`${styles.page} __container`} data-width={`large`}>
      <Toaster />

      <main className={`${styles.main} d-f-c`}>
        <h1>upProvider</h1>
        <ul>
          <li>Chain Id: {web3.utils.hexToNumber(auth.chainId)}</li>
          <li>Context Account: {auth.contextAccounts[0]}</li>
          <li>Is wallet connected: {auth.walletConnected ? <span className="badge badge-success">Yes</span> : <span className="badge badge-danger">No</span>}</li>
          <li>Accounts: {auth.accounts[0]}</li>
        </ul>
        <hr style={{ width: `100%` }} />
        Count: {count}
        <div className={`d-flex`}>
          <button className="btn" onClick={(e) => inc(e)}>
            +
          </button>
          <button className="btn" onClick={(e) => dec(e)}>
            -
          </button>
        </div>
      </main>

      <footer className={`${styles.footer} ms-motion-slideDownIn`}></footer>
    </div>
  )
}

export default Home
