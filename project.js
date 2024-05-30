const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 9876;
const WINDOW_SIZE = 10;
const THIRD_PARTY_API = 'http://20.244.58.144/test';

let numbersWindow = [];

const fetchNumbers = async (type) => {
  try {
    const source = axios.CancelToken.source();
    const timeout = setTimeout(() => {
      source.cancel(`Request timed out`);
    }, 500);

    const response = await axios.get(`${THIRD_PARTY_API}/${type}`, { cancelToken: source.token });
    clearTimeout(timeout);
    return response.data.numbers;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.error(error.message);
    } else {
      console.error('Error fetching numbers:', error.message);
    }
    return [];
  }
};

const calculateAverage = (numbers) => {
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return (sum / numbers.length).toFixed(2);
};

app.get('/numbers/:type', async (req, res) => {
  const { type } = req.params;
  const validTypes = ['p', 'f', 'e', 'r'];

  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid type parameter' });
  }

  const typeMap = {
    p: 'primes',
    f: 'fibo',
    e: 'even',
    r: 'rand',
  };

  const prevState = [...numbersWindow];
  const newNumbers = await fetchNumbers(typeMap[type]);

  // Add unique numbers to the window
  newNumbers.forEach(num => {
    if (!numbersWindow.includes(num)) {
      if (numbersWindow.length >= WINDOW_SIZE) {
        numbersWindow.shift(); // Remove the oldest number
      }
      numbersWindow.push(num);
    }
  });

  const average = numbersWindow.length > 0 ? calculateAverage(numbersWindow) : 0;

  const response = {
    windowPrevState: prevState,
    windowCurrState: numbersWindow,
    numbers: newNumbers,
    average: average
  };

  return res.json(response);
});

app.listen(PORT, () => {
  console.log(`Average Calculator Microservice is running on http://localhost:${PORT}`);
});
