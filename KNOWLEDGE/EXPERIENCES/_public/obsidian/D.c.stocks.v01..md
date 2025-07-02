



# viewer

```jsx
////////////////////////////////////////////////////
///             Initial Settings                 ///
////////////////////////////////////////////////////

const initialSettings = {
  vaultName: "YourActualVaultName", // **IMPORTANT:** Replace with your actual vault name :wip
  stockSymbol: "AAPL", // Predefine the stock symbol here
  tiingoApiToken: "YOUR_TIINGO_API_TOKEN", // Replace with your actual Tiingo API token
  viewHeight: "600px",
  placeholders: {
    headerTitle: "Stock Viewer",
  },
};

////////////////////////////////////////////////////
///               Helper Functions               ///
////////////////////////////////////////////////////

const { useState, useMemo, useEffect } = dc; // Assuming 'dc' is the Dataview context

////////////////////////////////////////////////////
///                 Components                   ///
////////////////////////////////////////////////////

function YahooStock({ symbol, apiToken }) {
  const [stockData, setStockData] = useState(null);

  useEffect(() => {
    // Fetching latest stock price data from Tiingo API endpoint
    async function fetchStockData() {
      try {
        console.log(`Fetching latest stock data for symbol: ${symbol}`); // Debugging log

        const requestUrl = `https://api.tiingo.com/tiingo/daily/${symbol}/prices?startDate=2019-01-02&token=${apiToken}`;

        const response = await fetch(requestUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Fetched data: ", data); // Debugging log
          setStockData(data[0]);
        } else {
          console.error("Error fetching stock data, status code: ", response.status);
        }
      } catch (error) {
        console.error("Error: ", error);
      }
    }

    if (symbol && apiToken) {
      fetchStockData();
    }
  }, [symbol, apiToken]);

  return (
    <div style={styles.stockContainer}>
      {stockData ? (
        <div>
          <h3>{symbol}</h3>
          <p>Open: ${stockData.open}</p>
          <p>High: ${stockData.high}</p>
          <p>Low: ${stockData.low}</p>
          <p>Close: ${stockData.close}</p>
          <p>Volume: {stockData.volume}</p>
        </div>
      ) : (
        <div>
          <p>Loading stock data...</p>
          <p>Debug Info: Make sure the Tiingo API endpoint is reachable, the symbol is correct, and the API token is valid.</p>
        </div>
      )}
    </div>
  );
}

////////////////////////////////////////////////////
///             Stock Graph Component            ///
////////////////////////////////////////////////////

function StockGraph({ stockData }) {
  useEffect(() => {
    if (!stockData) return;

    // Prepare data for graphing
    const labels = stockData.map((entry) => new Date(entry.date).toLocaleDateString());
    const closePrices = stockData.map((entry) => entry.close);

    // Render the graph using Chart.js
    const ctx = document.getElementById('stockChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Closing Price',
            data: closePrices,
            borderColor: 'rgba(75, 192, 192, 1)',
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }, [stockData]);

  return <canvas id="stockChart" style={{ width: "100%", height: "400px" }}></canvas>;
}

////////////////////////////////////////////////////
///                   Styles                     ///
////////////////////////////////////////////////////

const styles = {
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
    height: "100%", // Ensure it takes full height
  },
  header: {
    padding: "10px",
    backgroundColor: "var(--background-primary)",
  },
  headerTitle: {
    margin: 0,
    paddingBottom: "10px",
  },
  controlGroup: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  textbox: {
    padding: "8px",
    border: "1px solid var(--background-modifier-border)",
    backgroundColor: "var(--background-primary)",
    color: "var(--text-normal)",
    width: "200px",
    boxSizing: "border-box",
  },
  stockContainer: {
    padding: "10px",
    border: "1px solid var(--background-modifier-border)",
    marginBottom: "10px",
  },
};

////////////////////////////////////////////////////
///             Main View Component              ///
////////////////////////////////////////////////////

function View({ initialSettingsOverride = {}, app }) {
  // Merge default settings with the override
  const mergedSettings = useMemo(() => {
    return {
      ...initialSettings, // Default settings
      ...initialSettingsOverride, // Override settings
    };
  }, [initialSettingsOverride]);

  const [stockData, setStockData] = useState(null);

  useEffect(() => {
    // Fetch metadata or historical stock data on view load
    async function fetchStockData() {
      const requestUrl = `https://api.tiingo.com/tiingo/daily/${mergedSettings.stockSymbol}/prices?startDate=2019-01-02&token=${mergedSettings.tiingoApiToken}`;

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched metadata: ", data); // Debugging log
        setStockData(data);
      }
    }

    fetchStockData();
  }, [mergedSettings.stockSymbol, mergedSettings.tiingoApiToken]);

  return (
    <dc.Stack
      style={{ ...styles.mainContainer, height: mergedSettings.viewHeight }}
    >
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>
          {mergedSettings.placeholders.headerTitle}
        </h1>
      </div>

      <YahooStock symbol={mergedSettings.stockSymbol} apiToken={mergedSettings.tiingoApiToken} />
      {stockData && <StockGraph stockData={stockData} />}
    </dc.Stack>
  );
}

////////////////////////////////////////////////////
///             Exporting the Viewer Component    ///
////////////////////////////////////////////////////

return { View };

```