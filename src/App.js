import React, { useState, useEffect } from "react";
import './styles.css';

function App() {
  const [urlInput, setUrlInput] = useState("");
  const [scanType, setScanType] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [scanStatus, setScanStatus] = useState("");
  const [scanResult, setScanResult] = useState([]);
  const [showPrompt, setShowPrompt] = useState(false);

  const handleScanClick = () => {
    if (!urlInput || !scanType) {
      setScanStatus("Please enter a URL and select a scan type");
      return;
    }

    setScanStatus("Scanning...");

    setTimeout(() => {
      fetch("http://localhost:5000/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: urlInput,
          scanType: scanType,
          email: emailInput,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          setScanResult(data.result);
          if (data.result.length > 0) {
            setScanStatus("Vulnerabilities discovered");
          } else {
            if (scanType === "sql") {
              setScanStatus("No SQL injection vulnerability discovered");
            } else if (scanType === "xss") {
              setScanStatus("No XSS injection vulnerability discovered");
            } else {
              setScanStatus("No vulnerabilities discovered");
            }
          }
        })
        .catch((error) => {
          setScanStatus("Error scanning");
          console.log(error);
        });
    }, 120000); // 5 minutes in milliseconds
  };

  useEffect(() => {
    if (scanResult.length > 0) {
      setScanStatus("");
    }
  }, [scanResult]);

  const handleScanTypeChange = (e) => {
    setScanType(e.target.value);
    if (e.target.value === "automated") {
      setScanStatus("");
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setShowPrompt(true);
  };

  const renderScanTypeOptions = () => {
    if (scanType === "automated") {
      return (
        <div>
          <select value={scanType} onChange={handleScanTypeChange} className="select-field">
            <option value="">Select scan type</option>
            <option value="sql">SQL Injection</option>
            <option value="xss">XSS Injection</option>
          </select>
        </div>
      );
    } else {
      return (
        <div >
          <select value={scanType} onChange={handleScanTypeChange} >
            <option value="">Select scan type</option>
            <option value="manual">Manual scan</option>
            <option value="automated">Automated scan</option>
          </select>
          {scanType === "manual" && (
            <div>
              <p className="email-instruction">Enter your email address to receive a detailed report:</p>
              <form onSubmit={handleEmailSubmit}>
                <input
                  type="email"
                  placeholder="Enter your Mail ID"
                  className="input-field center-input"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
                {emailInput && (
                  <button type="submit" className="scan">Scan/OK</button>
                )}
              </form>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <>
      <nav className="nav">
        <div className="nav-menu" id="navMenu">
          <ul>
            <li>
              <a href="Home" className="link active">
                Home
              </a>
            </li>
          </ul>
        </div>
        <div className="nav-menu-btn">
          <i className="bx bx-menu"></i>
        </div>
      </nav>
      
      <div className="top">
          <h1>Web Application Vulnerability Scanner</h1>
      </div>
      <div className="enter">
        <input
          type="url"
          className="input-field center-input"
          placeholder="Enter URL"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
        />
        {renderScanTypeOptions()}
        {scanType !== "manual" && <button onClick={handleScanClick} className='scan' >Scan</button>}
      </div>
      {scanStatus && <p className="scan-status">Status: {scanStatus}</p>}
      {scanStatus === "Scanning..." && (
        <div>
          <p className="scan-status1">Scanning in progress. Please wait for around 5 minutes.</p>
        </div>
      )}
      {scanResult.length > 0 && (
        <div>
          <h3>Scan Result:</h3>
          {scanResult.map((result, index) => (
            <div key={index}>
              <p>URL: {result.url}</p>
              <p>EMAIL: {result.email}</p>
              <p>Form Details:</p>
              <pre>{JSON.stringify(result.form_details, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
      {showPrompt && <p className="scan-status">Thank you for your response! We will be back with your report shortly.</p>}
    </>
  );
}

export default App;

