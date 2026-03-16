const tutorialWindowTitle = document.getElementById('tutorialWindowTitle');
const tutorialWindowStep = document.getElementById('tutorialWindowStep');
const tutorialWindowTarget = document.getElementById('tutorialWindowTarget');
const tutorialWindowText = document.getElementById('tutorialWindowText');
const tutorialWindowNextButton = document.getElementById('tutorialWindowNextButton');
const tutorialWindowSkipButton = document.getElementById('tutorialWindowSkipButton');
const tutorialSpotlight = document.getElementById('tutorialSpotlight');
const tutorialDimTop = document.getElementById('tutorialDimTop');
const tutorialDimLeft = document.getElementById('tutorialDimLeft');
const tutorialDimRight = document.getElementById('tutorialDimRight');
const tutorialDimBottom = document.getElementById('tutorialDimBottom');
let currentTutorialAction = 'next';

function hideSpotlight() {
  tutorialSpotlight.hidden = true;
  tutorialDimTop.style.height = '100vh';
  tutorialDimLeft.style.width = '0px';
  tutorialDimRight.style.width = '0px';
  tutorialDimBottom.style.height = '0px';
}

function applySpotlight(rect) {
  if (!rect || !Number.isFinite(rect.left) || !Number.isFinite(rect.top) || !Number.isFinite(rect.width) || !Number.isFinite(rect.height)) {
    hideSpotlight();
    return;
  }

  const inset = 10;
  const left = Math.max(0, Math.round(rect.left - inset));
  const top = Math.max(0, Math.round(rect.top - inset));
  const width = Math.max(32, Math.round(rect.width + inset * 2));
  const height = Math.max(32, Math.round(rect.height + inset * 2));
  const right = Math.max(0, window.innerWidth - (left + width));
  const bottom = Math.max(0, window.innerHeight - (top + height));

  tutorialSpotlight.hidden = false;
  tutorialSpotlight.style.left = `${left}px`;
  tutorialSpotlight.style.top = `${top}px`;
  tutorialSpotlight.style.width = `${width}px`;
  tutorialSpotlight.style.height = `${height}px`;

  tutorialDimTop.style.left = '0px';
  tutorialDimTop.style.top = '0px';
  tutorialDimTop.style.width = '100vw';
  tutorialDimTop.style.height = `${top}px`;

  tutorialDimLeft.style.left = '0px';
  tutorialDimLeft.style.top = `${top}px`;
  tutorialDimLeft.style.width = `${left}px`;
  tutorialDimLeft.style.height = `${height}px`;

  tutorialDimRight.style.left = `${left + width}px`;
  tutorialDimRight.style.top = `${top}px`;
  tutorialDimRight.style.width = `${right}px`;
  tutorialDimRight.style.height = `${height}px`;

  tutorialDimBottom.style.left = '0px';
  tutorialDimBottom.style.top = `${top + height}px`;
  tutorialDimBottom.style.width = '100vw';
  tutorialDimBottom.style.height = `${bottom}px`;
}

function renderTutorialStep(step) {
  if (!step) {
    hideSpotlight();
    return;
  }

  tutorialWindowTitle.textContent = step.title || 'Livemap Einführung';
  tutorialWindowStep.textContent = step.stepLabel || 'Schritt';
  tutorialWindowTarget.textContent = step.targetLabel || 'Bereich';
  tutorialWindowText.textContent = step.text || '';
  currentTutorialAction = step.action || 'next';
  tutorialWindowNextButton.textContent = step.nextDisabled ? 'Border-Button' : (step.nextLabel || 'Weiter');
  tutorialWindowNextButton.disabled = false;
  applySpotlight(step.targetRect || null);
}

tutorialWindowNextButton?.addEventListener('click', () => {
  window.livemapApi.requestTutorialAction(currentTutorialAction);
});

tutorialWindowSkipButton?.addEventListener('click', () => {
  window.livemapApi.requestTutorialAction('skip');
});

window.livemapApi.onTutorialStep((step) => {
  renderTutorialStep(step);
});

window.addEventListener('resize', () => {
  hideSpotlight();
});
