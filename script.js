const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function generateDraw() {
  const numbers = new Set();
  while (numbers.size < 5) {
    numbers.add(getRandomInt(1, 49));
  }
  return {
    main: [...numbers].sort((a, b) => a - b),
    bonus: getRandomInt(1, 10)
  };
}

function compareDraws(player, draw) {
  const matchMain = player.main.filter(n => draw.main.includes(n)).length;
  const matchBonus = player.bonus === draw.bonus ? 1 : 0;
  return `${matchMain}+${matchBonus}`;
}

function getGain(category) {
  const table = {
    "0+1": 2.2,
    "1+1": 2.2,
    "2+0": 4.4,
    "2+1": 10,
    "3+0": 20,
    "3+1": 50,
    "4+0": 400,
    "4+1": 1000,
    "5+0": 100000,
    "5+1": 2000000
  };
  return table[category] || 0;
}

// Gestion des onglets
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// Fonction de tirage loto : 5 numéros uniques entre 1-49 + 1 complémentaire 1-10
function drawLoto() {
  const mainNumbers = new Set();
  while (mainNumbers.size < 5) {
    mainNumbers.add(Math.floor(Math.random() * 49) + 1);
  }
  const mainArray = Array.from(mainNumbers).sort((a,b) => a-b);
  const complementary = Math.floor(Math.random() * 10) + 1;
  return { main: mainArray, complementary };
}

// Affiche les billes avec animation dans #balls-container
function showBalls(draw) {
  const container = document.getElementById('balls-container');
  container.innerHTML = '';
  draw.main.forEach((num, i) => {
    const ball = document.createElement('div');
    ball.className = 'ball';
    ball.textContent = num;
    ball.style.animationDelay = `${i * 0.3}s`;
    container.appendChild(ball);
  });
  const compBall = document.createElement('div');
  compBall.className = 'ball complementary';
  compBall.textContent = draw.complementary;
  compBall.style.animationDelay = `${draw.main.length * 0.3}s`;
  container.appendChild(compBall);
}

// Tirage visuel + animation
document.getElementById('draw-button').addEventListener('click', () => {
  const draw = drawLoto();
  showBalls(draw);
});

// Fonction pour comparer tirage parfait (par défaut : tirage aléatoire)
function isPerfectMatch(draw, userPick) {
  // userPick: { main: [nums], complementary: num }
  if (!userPick) return false;
  if (draw.complementary !== userPick.complementary) return false;
  for(let i = 0; i < 5; i++) {
    if(draw.main[i] !== userPick.main[i]) return false;
  }
  return true;
}

// Simulation rapide avec gains
const simForm = document.getElementById('simulation-form');
simForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const mainInput = document.getElementById('sim-main').value;
  const bonusInput = parseInt(document.getElementById('sim-chance').value);
  const drawCount = parseInt(document.getElementById('sim-count').value);

  const playerMain = mainInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
  if (playerMain.length !== 5 || new Set(playerMain).size !== 5 || playerMain.some(n => n < 1 || n > 49)) {
    alert("Entrez 5 numéros uniques entre 1 et 49.");
    return;
  }
  if (isNaN(bonusInput) || bonusInput < 1 || bonusInput > 10) {
    alert("Entrez un numéro chance entre 1 et 10.");
    return;
  }

  const progress = document.getElementById('progress-bar');
  const results = {};
  let totalGain = 0;

  for (let i = 0; i < drawCount; i++) {
    const draw = generateDraw();
    const category = compareDraws({ main: playerMain, bonus: bonusInput }, draw);
    results[category] = (results[category] || 0) + 1;
    totalGain += getGain(category);
    if (i % 1000 === 0) {
      progress.style.width = `${(i / drawCount) * 100}%`;
    }
  }
  progress.style.width = `100%`;

  const resEl = document.getElementById('sim-result');
  const gainEl = document.getElementById('sim-gain');
  resEl.innerHTML = '<h3>Résultats des tirages :</h3>';
  gainEl.innerHTML = '';
  for (const [key, value] of Object.entries(results).sort()) {
    const percent = ((value / drawCount) * 100).toFixed(4);
    resEl.innerHTML += `<p>${key} : ${value.toLocaleString()} tirages (${percent}%)</p>`;
  }

  gainEl.innerHTML += `<h3>Gain total estimé : ${totalGain.toLocaleString(undefined, { style: 'currency', currency: 'EUR' })}</h3>`;
  gainEl.innerHTML += `<p>Gain moyen par grille : ${(totalGain / drawCount).toFixed(2)} €</p>`;
});

// Simulation jusqu'au gros lot
document.getElementById('until-jackpot-button').addEventListener('click', async () => {
  const userPickStr = prompt('Entrez vos 5 numéros (1-49, séparés par des virgules) :');
  if(!userPickStr) return;
  const mainNums = userPickStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n>=1 && n<=49);
  if(mainNums.length !== 5) {
    alert('Veuillez saisir 5 numéros valides entre 1 et 49.');
    return;
  }
  mainNums.sort((a,b) => a-b);

  const chanceStr = prompt('Entrez votre numéro chance (1-10) :');
  const chance = parseInt(chanceStr);
  if(isNaN(chance) || chance < 1 || chance > 10) {
    alert('Numéro chance doit être entre 1 et 10.');
    return;
  }

  const userPick = { main: mainNums, complementary: chance };
  let attempts = 0;

  const resultContainer = document.getElementById('until-jackpot-result');
  resultContainer.textContent = 'Simulation en cours...';

  // Boucle jusqu'au jackpot
  while(true) {
    attempts++;
    const draw = drawLoto();
    if(isPerfectMatch(draw, userPick)) {
      resultContainer.textContent = `Jackpot obtenu après ${attempts.toLocaleString()} tirages ! 🎉`;
      break;
    }
    if (attempts % 100000 === 0) {
      resultContainer.textContent = `Simulation en cours... (${attempts.toLocaleString()} tirages)`;
      await new Promise(r => setTimeout(r, 0)); // Laisser respirer le thread
    }
  }
});

// Simulation durée de vie
document.getElementById('life-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const ageNow = parseInt(document.getElementById('age-now').value);
  const ageEnd = parseInt(document.getElementById('age-end').value);
  const gridsPerDraw = parseInt(document.getElementById('grids-per-draw').value);

  if(ageNow < 1 || ageNow > 120 || ageEnd < ageNow || ageEnd > 150) {
    alert('Veuillez saisir des âges valides (âge actuel < âge de fin, valeurs raisonnables).');
    return;
  }
  if(gridsPerDraw < 1 || gridsPerDraw > 1000) {
    alert('Nombre de grilles par tirage invalide.');
    return;
  }

   const pricePerGrid = 2.20; // prix d'une grille en euros
  const yearsLeft = ageEnd - ageNow;
  const drawsPerYear = 3 * 52; // environ 3 tirages par semaine, soit 156 tirages/an
  const totalDraws = yearsLeft * drawsPerYear;
  const totalGrids = totalDraws * gridsPerDraw;
  const totalCost = totalGrids * pricePerGrid;

  const result = `
    <p>Nombre de tirages possibles durant cette période : <b>${totalDraws.toLocaleString()}</b></p>
    <p>Nombre total de grilles jouées (avec ${gridsPerDraw} grille(s) par tirage) : <b>${totalGrids.toLocaleString()}</b></p>
    <p>Coût total estimé (à 2,20 € la grille) : <b>${totalCost.toLocaleString(undefined, {style: 'currency', currency: 'EUR'})}</b></p>
  `;

  document.getElementById('life-result').innerHTML = result;
});