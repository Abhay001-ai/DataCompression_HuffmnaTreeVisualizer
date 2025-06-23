// Navigation
document.getElementById('encryptionBtn').addEventListener('click', () => {
  document.getElementById('landingPage').style.display = 'none';
  document.getElementById('encryptionScreen').style.display = 'flex';
});

document.getElementById('visualizationBtn').addEventListener('click', () => {
  document.getElementById('landingPage').style.display = 'none';
  document.getElementById('visualizationScreen').style.display = 'flex';
});

document.getElementById('backBtn1').addEventListener('click', () => {
  document.getElementById('encryptionScreen').style.display = 'none';
  document.getElementById('landingPage').style.display = 'flex';
});

document.getElementById('backBtn2').addEventListener('click', () => {
  document.getElementById('visualizationScreen').style.display = 'none';
  document.getElementById('landingPage').style.display = 'flex';
});

// Encryption
let huffmanTree = null;
let encodedText = '';
let codeMap = {};

document.getElementById('fileInput').addEventListener('change', handleFileSelect);
document.getElementById('encodeBtn').addEventListener('click', encodeText);
document.getElementById('decodeBtn').addEventListener('click', decodeText);

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file && file.type === 'text/plain') {
    const reader = new FileReader();
    reader.onload = e => document.getElementById('inputText').value = e.target.result;
    reader.readAsText(file);
  } else {
    alert('Please upload a valid .txt file.');
  }
}

async function encodeText() {
  const text = document.getElementById('inputText').value;
  const key = document.getElementById('shuffleKey').value;

  if (!text || !key) {
    alert('Please provide both text and shuffle key.');
    return;
  }

  try {
    const response = await fetch('/api/huffman/encode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, key }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Encoding failed');
    }

    encodedText = data.encodedText;
    document.getElementById('outputText').value = encodedText;
    downloadFile(encodedText, 'encoded.txt');

    document.getElementById('compressionStats').innerText =
      `Original Size: ${data.stats.originalSizeBytes} bytes\n` +
      `Compressed Size: ${data.stats.compressedSizeBytes} bytes\n` +
      `Compression Ratio: ${data.stats.compressionRatio.toFixed(2)}% of original size\n` +
      `Size Reduction: ${data.stats.sizeReduction.toFixed(2)}%`;

    // Store the code map for decoding
    codeMap = data.codeMap || {};
  } catch (error) {
    console.error('Encoding error:', error);
    alert('Error during encoding: ' + error.message);
  }
}

async function decodeText() {
  const key = document.getElementById('shuffleKey').value;

  if (!encodedText || !key) {
    alert('Ensure text is encoded and key is provided.');
    return;
  }

  try {
    const response = await fetch('/api/huffman/decode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ encodedText, key, codeMap }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Decoding failed');
    }

    document.getElementById('outputText').value = data.decodedText;
    downloadFile(data.decodedText, 'decoded.txt');
  } catch (error) {
    console.error('Decoding error:', error);
    alert('Error during decoding: ' + error.message);
  }
}

function downloadFile(content, fileName) {
  const blob = new Blob([content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
}
//-------------------------------------------------------------------//
// In your script.js, add this function to format compression stats
function displayCompressionStats(stats) {
  const statsContainer = document.getElementById('compressionStats');
  statsContainer.innerHTML = '';
  
  const statsData = [
    { label: 'Original Size', value: stats.originalSize + ' bytes' },
    { label: 'Compressed Size', value: stats.compressedSize + ' bytes' },
    { label: 'Compression Ratio', value: (stats.compressionRatio * 100).toFixed(2) + '%' },
    { label: 'Space Saving', value: (stats.spaceSaving * 100).toFixed(2) + '%' },
    { label: 'Entropy', value: stats.entropy.toFixed(4) },
    { label: 'Average Code Length', value: stats.avgCodeLength.toFixed(2) + ' bits' }
  ];
  
  statsData.forEach(stat => {
    const statElement = document.createElement('div');
    statElement.className = 'stat-item';
    statElement.innerHTML = `
      <div class="stat-label">${stat.label}</div>
      <div class="stat-value">${stat.value}</div>
    `;
    statsContainer.appendChild(statElement);
  });
}
//----------------------------------------------------------------//
// Visualization
let svgNS = "http://www.w3.org/2000/svg";

document.getElementById('visFileInput').addEventListener('change', event => {
  const file = event.target.files[0];
  if (file && file.type === 'text/plain') {
    const reader = new FileReader();
    reader.onload = e => document.getElementById('visInputText').value = e.target.result;
    reader.readAsText(file);
  }
});

document.getElementById('visualizeBtn').addEventListener('click', async () => {
  const text = document.getElementById('visInputText').value;
  if (!text) {
    alert('Please provide text.');
    return;
  }

  try {
    const response = await fetch('/api/huffman/visualize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Visualization failed');
    }

    const svg = document.getElementById('treeSvg');
    svg.innerHTML = '';
    renderHuffmanTree(data.tree);
  } catch (err) {
    console.error('Visualization error:', err);
    alert('Error visualizing tree: ' + err.message);
  }
});

function renderHuffmanTree(tree) {
  const svg = document.getElementById('treeSvg');
  svg.innerHTML = '';
  const positions = new Map();
  let xCounter = 0;

  // Calculate node positions first
  function calculatePositions(node, depth = 0) {
    if (!node) return { count: 0 };

    if (!node.left && !node.right) {
      positions.set(node, { x: xCounter++, y: depth });
      return { count: 1 };
    }

    const left = calculatePositions(node.left, depth + 1);
    const right = calculatePositions(node.right, depth + 1);

    positions.set(node, {
      x: (positions.get(node.left).x + positions.get(node.right).x) / 2,
      y: depth
    });

    return { count: left.count + right.count };
  }

  calculatePositions(tree);

  const spacingX = 60;
  const spacingY = 80;
  const radius = 20;

  // Animation function to draw nodes with delay
  async function drawTree(node, parent = null) {
    if (!node) return;

    const nodePos = positions.get(node);
    const x = nodePos.x * spacingX + 50;
    const y = nodePos.y * spacingY + 50;

    // Draw connecting line if there's a parent
    if (parent) {
      const parentPos = positions.get(parent);
      const parentX = parentPos.x * spacingX + 50;
      const parentY = parentPos.y * spacingY + 50;
      const dx = x - parentX, dy = y - parentY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const line = document.createElementNS(svgNS, "line");
      line.setAttribute('x1', parentX + dx * radius / dist);
      line.setAttribute('y1', parentY + dy * radius / dist);
      line.setAttribute('x2', parentX + dx * radius / dist); // Start with same point
      line.setAttribute('y2', parentY + dy * radius / dist); // Start with same point
      line.setAttribute('stroke', '#555');
      line.setAttribute('stroke-width', '1.5px');
      line.setAttribute('class', 'tree-line');
      svg.appendChild(line);

      // Animate the line drawing
      await new Promise(resolve => {
        const duration = 500; // milliseconds
        const startTime = performance.now();
        
        function animateLine(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          line.setAttribute('x2', parentX + dx * radius / dist + dx * (1 - radius / dist) * progress);
          line.setAttribute('y2', parentY + dy * radius / dist + dy * (1 - radius / dist) * progress);
          
          if (progress < 1) {
            requestAnimationFrame(animateLine);
          } else {
            resolve();
          }
        }
        
        requestAnimationFrame(animateLine);
      });
    }

    // Create node circle (initially invisible)
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', 0); // Start with radius 0
    circle.setAttribute('fill', '#007bff');
    circle.setAttribute('stroke', '#333');
    circle.setAttribute('stroke-width', '2px');
    circle.setAttribute('class', 'tree-node');
    svg.appendChild(circle);

    // Animate circle growing
    await new Promise(resolve => {
      const duration = 300; // milliseconds
      const startTime = performance.now();
      
      function animateCircle(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        circle.setAttribute('r', radius * progress);
        
        if (progress < 1) {
          requestAnimationFrame(animateCircle);
        } else {
          resolve();
        }
      }
      
      requestAnimationFrame(animateCircle);
    });

    // Add text label
    const label = document.createElementNS(svgNS, "text");
    label.setAttribute('x', x);
    label.setAttribute('y', y + 5);
    label.setAttribute('fill', 'white');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('font-size', '12px');
    label.setAttribute('opacity', '0'); // Start invisible
    label.textContent = node.char !== null ? `${node.char}: ${node.freq}` : node.freq;
    label.setAttribute('class', 'tree-label');
    svg.appendChild(label);

    // Animate label fade-in
    await new Promise(resolve => {
      const duration = 200; // milliseconds
      const startTime = performance.now();
      
      function animateLabel(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        label.setAttribute('opacity', progress);
        
        if (progress < 1) {
          requestAnimationFrame(animateLabel);
        } else {
          resolve();
        }
      }
      
      requestAnimationFrame(animateLabel);
    });

    // Recursively draw children with delay between them
    if (node.left) await drawTree(node.left, node);
    if (node.right) await drawTree(node.right, node);
  }

  // Start the animation
  drawTree(tree).then(() => {
    // Set the viewBox after animation completes
    const allPositions = Array.from(positions.values());
    const minX = Math.min(...allPositions.map(p => p.x * spacingX)) - 50;
    const maxX = Math.max(...allPositions.map(p => p.x * spacingX)) + 100;
    const maxY = Math.max(...allPositions.map(p => p.y * spacingY)) + 100;
    svg.setAttribute('viewBox', `${minX} 0 ${maxX - minX} ${maxY}`);
  });
}