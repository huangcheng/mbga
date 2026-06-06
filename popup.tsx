import "~/style.css"
import { useState } from "react"

function IndexPopup() {
  const [data, setData] = useState("")

  return (
    <div className="p-4 w-80">
      <h2 className="text-lg font-bold mb-2">
        Welcome to your{" "}
        <a
          href="https://www.plasmo.com"
          target="_blank"
          className="text-blue-500 hover:underline">
          Plasmo
        </a>{" "}
        Extension!
      </h2>
      <input
        className="w-full px-3 py-2 border border-gray-300 rounded mb-3"
        onChange={(e) => setData(e.target.value)}
        value={data}
      />
      <a
        href="https://docs.plasmo.com"
        target="_blank"
        className="text-blue-500 hover:underline">
        View Docs
      </a>
    </div>
  )
}

export default IndexPopup
