fetch('http://localhost:3000/api/ai/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cars: [{brand: 'Ford', model: 'Focus', year: 2015, km: 100000, price: 5000, aiStatus: 'Buen estado'}] })
}).then(res => res.text()).then(console.log).catch(console.error);
