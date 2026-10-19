(() => {
  const screen = document.querySelector('#screen');
  const stepLabel = document.querySelector('#step-label');
  const conditionLabel = document.querySelector('#condition-label');
  let marketData;
  let assignment;
  let month = 0;
  let allocation = 50;
  let startingAllocation = 50;
  let portfolioWealth = 100;
  let lastFeedbackWealth = 100;
  let lastFeedbackLabel = 'start';
  let initialAllocationTouched = false;
  let allocationTouched = false;
  let reportedValues = [100];
  const decisions = [];
  const ratings = [];
  const allocationByMonth = [];

  function assignCondition() {
    const feedback = Math.random() < 0.5 ? 'monthly' : 'quarterly';
    const decisionFrequency = Math.random() < 0.5 ? 'monthly' : 'quarterly';
    return { feedback, decisionFrequency };
  }

  function updateStatus() {
    stepLabel.textContent = `ROUND ${Math.min(month + 1, 12)} / 12`;
    conditionLabel.textContent = `${assignment.feedback.toUpperCase()} FEEDBACK · ${assignment.decisionFrequency.toUpperCase()} DECISIONS`;
  }

  function isFeedbackPoint() {
    return assignment.feedback === 'monthly' || (month + 1) % 3 === 0;
  }

  function canDecide() {
    return assignment.decisionFrequency === 'monthly' || (month + 1) % 3 === 0;
  }

  function chart(values = reportedValues) {
    const min = Math.min(...values) - 2;
    const max = Math.max(...values) + 2;
    const points = values.map((value, index) => {
      const x = 8 + index * (384 / (values.length - 1));
      const y = 94 - ((value - min) / (max - min || 1)) * 78;
      return `${x},${y}`;
    }).join(' ');
    const latest = values.at(-1).toFixed(1);
    return `<svg class="market" viewBox="0 0 400 112" role="img" aria-label="Hypothetical portfolio index at scheduled feedback points only, now ${latest}, starting at 100"><path d="M8 98H392" stroke="#dce4df"/><polyline points="${points}" fill="none" stroke="#28664e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="8" y="110" fill="#677873" font-size="12">START 100</text><text x="392" y="110" fill="#677873" font-size="12" text-anchor="end">NOW ${latest}</text></svg>`;
  }

  function showRound() {
    if (month >= 12) return showSummary();
    const monthlyPortfolioReturn = marketData.returns[month].rf + (allocation / 100) * marketData.returns[month].mkt_rf;
    portfolioWealth *= 1 + monthlyPortfolioReturn / 100;
    updateStatus();
    const hasFeedback = isFeedbackPoint();
    const isCommonAssessment = (month + 1) % 3 === 0;
    const decisionAllowed = canDecide();
    const intervalReturn = (portfolioWealth / lastFeedbackWealth - 1) * 100;
    const intervalLabel = lastFeedbackLabel === 'start' ? 'since start' : `since the ${lastFeedbackLabel} report`;
    const feedbackText = hasFeedback
      ? `<p><strong>${marketData.returns[month].month} report:</strong> ${intervalReturn >= 0 ? '+' : ''}${intervalReturn.toFixed(1)}% ${intervalLabel}. Cumulative hypothetical portfolio index: ${portfolioWealth.toFixed(1)} (starting value 100).</p>`
      : '';
    const decisionText = decisionAllowed
      ? `<label for="allocation"><strong>Choose an allocation for the risky investment</strong></label><div class="choice"><input id="allocation" type="range" min="0" max="100" value="${allocation}" aria-valuetext="${allocation} percent"><output id="allocation-value" for="allocation">${allocation}%</output></div>`
      : '<p>Your next scheduled allocation decision is at the next quarter.</p>';
    screen.innerHTML = `<h2 tabindex="-1">${marketData.returns[month].month}${hasFeedback ? ': performance update' : ''}</h2>${hasFeedback ? chart([...reportedValues, portfolioWealth]) : '<div class="no-update">No scheduled performance report this month.</div>'}${feedbackText}<div>${decisionText}</div><button id="continue" class="button">Continue <span aria-hidden="true">&rarr;</span></button><p class="fine">Historical U.S. market factors; target allocation is rebalanced monthly, including between decision opportunities. No fees, taxes, or advice.</p>`;
    screen.querySelector('h2').focus();
    allocationTouched = false;
    const allocationInput = screen.querySelector('#allocation');
    if (allocationInput) allocationInput.addEventListener('input', (event) => {
      allocation = Number(event.target.value);
      allocationTouched = true;
      screen.querySelector('#allocation-value').textContent = `${allocation}%`;
      event.target.setAttribute('aria-valuetext', `${allocation} percent`);
    });
    screen.querySelector('#continue').addEventListener('click', () => {
      if (decisionAllowed) decisions.push({ month, allocation, sliderInteracted: allocationTouched });
      allocationByMonth.push(allocation);
      if (hasFeedback) {
        reportedValues.push(portfolioWealth);
        lastFeedbackWealth = portfolioWealth;
        lastFeedbackLabel = marketData.returns[month].month;
      }
      if (hasFeedback && isCommonAssessment) showStateRating();
      else advanceMonth();
    });
  }

  function showStateRating() {
    screen.innerHTML = `<h2 tabindex="-1">Quarter-end check-in</h2><p>Your allocation choice is recorded for this round. Thinking only about the report you just saw, rate your immediate response.</p><div class="ratings"><label>How risky did the investment feel? <input id="risk-rating" type="range" min="0" max="100" value="50" aria-valuetext="50 out of 100"><output for="risk-rating" id="risk-value">50</output><span>0 = not risky · 100 = extremely risky</span></label><label>How uneasy did you feel? <input id="emotion-rating" type="range" min="0" max="100" value="50" aria-valuetext="50 out of 100"><output for="emotion-rating" id="emotion-value">50</output><span>0 = not uneasy · 100 = extremely uneasy</span></label></div><button id="next-month" class="button">Continue <span aria-hidden="true">&rarr;</span></button>`;
    screen.querySelector('h2').focus();
    const ratingInteraction = { risk: false, unease: false };
    for (const [inputId, outputId] of [['risk-rating', 'risk-value'], ['emotion-rating', 'emotion-value']]) {
      const input = screen.querySelector(`#${inputId}`);
      input.addEventListener('input', () => {
        screen.querySelector(`#${outputId}`).textContent = input.value;
        input.setAttribute('aria-valuetext', `${input.value} out of 100`);
        ratingInteraction[inputId === 'risk-rating' ? 'risk' : 'unease'] = true;
      });
    }
    screen.querySelector('#next-month').addEventListener('click', () => {
      ratings.push({ month, risk: Number(screen.querySelector('#risk-rating').value), unease: Number(screen.querySelector('#emotion-rating').value), riskInteracted: ratingInteraction.risk, uneaseInteracted: ratingInteraction.unease });
      advanceMonth();
    });
  }

  function advanceMonth() {
    month += 1;
    showRound();
  }

  function showSummary() {
    stepLabel.textContent = 'PROTOTYPE COMPLETE';
    conditionLabel.textContent = 'NO DATA SAVED';
    const terminalAllocation = allocationByMonth.at(-1) ?? allocation;
    const quarterEndAllocations = [2, 5, 8, 11].map((index) => allocationByMonth[index]).filter(Number.isFinite);
    const meanQuarterAllocation = quarterEndAllocations.length ? Math.round(quarterEndAllocations.reduce((sum, value) => sum + value, 0) / quarterEndAllocations.length) : terminalAllocation;
    const uneaseResponses = ratings.filter((item) => item.uneaseInteracted);
    const meanUnease = uneaseResponses.length ? Math.round(uneaseResponses.reduce((sum, item) => sum + item.unease, 0) / uneaseResponses.length) : null;
    const decisionCount = decisions.filter((item) => item.month >= 0).length;
    const uneaseSummary = meanUnease === null ? 'No unease slider values were changed from the default.' : `Mean unease among ${uneaseResponses.length} adjusted check-in rating${uneaseResponses.length === 1 ? '' : 's'} was <strong>${meanUnease}/100</strong>.`;
    const startingChoiceLabel = initialAllocationTouched ? 'selected or adjusted before the simulation' : 'left at the untouched 50% default';
    screen.innerHTML = `<h2 tabindex="-1">Your choices, for reflection</h2><div class="result">Your starting risky allocation was <strong>${startingAllocation}%</strong> (${startingChoiceLabel}); your final risky allocation was <strong>${terminalAllocation}%</strong>. Average allocation at common quarter-end checkpoints was <strong>${meanQuarterAllocation}%</strong>. You made ${decisionCount} allocation decision${decisionCount === 1 ? '' : 's'} after the starting choice. ${uneaseSummary}</div><p>These numbers describe only your choices in this short prototype. They are not a validated risk-tolerance score, a comparison with other people, or investment advice.</p><p class="fine">The proposed study's primary endpoint is terminal risky allocation, observed at the same horizon in every condition. The real study would compare randomized groups, not infer an effect from an individual demo run. Your responses were not saved or sent.</p><button id="again" class="button">Try another random condition <span aria-hidden="true">&rarr;</span></button><p><a href="/cases/check-in-effect.html">Read the research protocol &nearr;</a></p>`;
    screen.querySelector('h2').focus();
    screen.querySelector('#again').addEventListener('click', showSetup);
  }

  function reset() {
    month = 0;
    allocation = 50;
    startingAllocation = 50;
    portfolioWealth = 100;
    lastFeedbackWealth = 100;
    lastFeedbackLabel = 'start';
    reportedValues = [100];
    decisions.length = 0;
    ratings.length = 0;
    allocationByMonth.length = 0;
  }

  function beginStudy() {
    const initialInput = screen.querySelector('#initial-allocation');
    const initialAllocation = Number(initialInput.value);
    initialAllocationTouched = initialInput.dataset.touched === 'true';
    reset();
    allocation = initialAllocation;
    startingAllocation = initialAllocation;
    assignment = assignCondition();
    decisions.push({ month: -1, allocation, sliderInteracted: initialAllocationTouched });
    showRound();
  }

  function attachSetup() {
    const initialInput = screen.querySelector('#initial-allocation');
    const updateStartingAllocation = (value, interacted) => {
      initialInput.value = value;
      if (interacted) initialInput.dataset.touched = 'true';
      initialInput.setAttribute('aria-valuetext', `${value} percent`);
      screen.querySelector('#initial-allocation-value').textContent = `${value}%`;
    };
    initialInput.addEventListener('input', () => {
      updateStartingAllocation(initialInput.value, true);
    });
    screen.querySelector('#keep-50').addEventListener('click', () => updateStartingAllocation(50, true));
    screen.querySelector('#start').addEventListener('click', beginStudy);
  }

  function showSetup({ moveFocus = true } = {}) {
    stepLabel.textContent = 'SETUP';
    conditionLabel.textContent = 'RANDOM ASSIGNMENT';
    screen.innerHTML = `<h2 tabindex="-1">Set your starting allocation</h2><p>Before the historical period begins, choose the share of your hypothetical portfolio allocated to the risky market investment.</p><label for="initial-allocation"><strong>Starting risky allocation</strong></label><div class="choice"><input id="initial-allocation" type="range" min="0" max="100" value="50" aria-valuetext="50 percent"><output id="initial-allocation-value" for="initial-allocation">50%</output></div><button id="keep-50" type="button" class="button">Keep 50% intentionally</button> <button id="start" class="button">Begin historical prototype <span aria-hidden="true">&rarr;</span></button><p class="fine">This is a research-design prototype, not a validated investment or risk assessment.</p>`;
    if (moveFocus) screen.querySelector('h2').focus();
    attachSetup();
  }

  fetch('market-returns-2020.json')
    .then((response) => {
      if (!response.ok) throw new Error('Historical return file could not be loaded.');
      return response.json();
    })
    .then((dataset) => {
      if (!Array.isArray(dataset.returns) || dataset.returns.length !== 12 || dataset.returns.some((item) => !Number.isFinite(item.mkt_rf) || !Number.isFinite(item.rf))) {
        throw new Error('Historical return file failed validation.');
      }
      marketData = dataset;
      showSetup({ moveFocus: false });
    })
    .catch(() => {
      screen.innerHTML = '<h2>Historical data unavailable</h2><p>Reload the page or open it from the hosted site. No answers have been collected.</p>';
    });
})();
