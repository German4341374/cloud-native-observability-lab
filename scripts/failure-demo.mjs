const modes = ['success', 'success', 'success', 'slow', 'error', 'timeout'];
for (const mode of modes) {
  const response = await fetch(`http://127.0.0.1:8080/api/checkout?mode=${mode}`);
  console.log(JSON.stringify({ mode, status: response.status }));
}
console.log('Inspect correlated signals at http://127.0.0.1:3000');
