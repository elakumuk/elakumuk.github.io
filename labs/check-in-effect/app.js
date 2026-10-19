(() => {
  const screen = document.querySelector('#screen');
  const stepLabel = document.querySelector('#step-label');
  const conditionLabel = document.querySelector('#condition-label');
  const startButton = document.querySelector('#start');
  let marketData;
  let assignment;
  let month = 0;
  let allocation = 50;
  let portfolioWealth = 100;
  const decisions = [];
  const ratings = [];
  const allocationByMonth = [];
  const portfolioValues = [];

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
    return assignment.feedback === 'monthly' || (month + 1) % 3 === 0 || month === 11;
  }

  function canDecide() {
    return assignment.decisionFrequency === 'monthly' || (month + 1) % 3 === 0 || month === 11;
  }

  function chart() {
    const values = [100, ...portfolioValues];
    const min = Math.min(...values) - 2;
    const max = Math.max(...values) + 2;
    const points = values.map((value, index) => {
      const x = 8 + index * (384 / (values.length - 1));
      const y = 94 - ((value - min) / (max - min || 1)) * 78;
      return `${x},${y}`;
    }).join(' ');
    const latest = values.at(-1).toFixed(1);
    return `<svg class="market" viewBox="0 0 400 112" role="img" aria-label="Historical market-based hypothetical portfolio index, now ${latest}, starting at 100"><path d="M8 98H392" stroke="#dce4df"/><polyline points="${points}" fill="none" stroke="#28664e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="8" y="110" fill="#677873" font-size="9">START 100</text><text x="392" y="110" fill="#677873" font-size="9" text-anchor="end">NOW ${latest}</text></svg>`;
  }

  function showRound() {
    if (month >= 12) return showSummary();
    const monthlyPortfolioReturn = marketData.returns[month].rf + (allocation / 100) * marketData.returns[month].mkt_rf;
    portfolioWealth *= 1 + monthlyPortfolioReturn / 100;
    portfolioValues.push(portfolioWealth);
    updateStatus();
    const reportedReturn = portfolioWealth / 100 - 1;
    const hasFeedback = isFeedbackPoint();
    const isCommonAssessment = (month + 1) % 3 === 0 || month === 11;
    const decisionAllowed = canDecide();
    const feedbackText = hasFeedback
      ? `<p><strong>${marketData.returns[month].month} report:</strong> your hypothetical portfolio index is ${portfolioWealth.toFixed(1)} (starting value 100), or ${(reportedReturn * 100).toFixed(1)}% since the start.</p>${isCommonAssessment ? '<p class="fine">After choosing your allocation, you will rate your immediate response.</p>' : ''}`
      : '';
    const decisionText = decisionAllowed
      ? `<label for="allocation"><strong>Choose an allocation for the risky investment</strong></label><div class="choice"><input id="allocation" type="range" min="0" max="100" value="${allocation}"><output id="allocation-value">${allocation}%</output></div>`
      : '<p>Your next scheduled allocation decision is at the next quarter.</p>';
    screen.innerHTML = `<h2>${marketData.returns[month].month}${hasFeedback ? ': performance update' : ''}</h2>${hasFeedback ? chart() : '<div class="no-update">No scheduled performance report this month.</div>'}${feedbackText}<div>${decisionText}</div><button id="continue" class="button">Continue <span aria-hidden="true">&rarr;</span></button><p class="fine">Historical U.S. market factors; portfolio return uses your allocation and the stated hypothetical cash assumption. No fees, taxes, or advice.</p>`;
    const allocationInput = screen.querySelector('#allocation');
    if (allocationInput) allocationInput.addEventListener('input', (event) => {
      allocation = Number(event.target.value);
      screen.querySelector('#allocation-value').textContent = `${allocation}%`;
    });
    screen.querySelector('#continue').addEventListener('click', () => {
      if (decisionAllowed) decisions.push({ month, allocation });
      allocationByMonth.push(allocation);
      if (hasFeedback && isCommonAssessment) showStateRating();
      else advanceMonth();
    });
  }

  function showStateRating() {
    screen.innerHTML = `<h2>Quarter-end check-in</h2><p>Your allocation choice is recorded for this round. Thinking only about the report you just saw, rate your immediate response.</p><div class="ratings"><label>How risky did the investment feel? <input id="risk-rating" type="range" min="0" max="100" value="50"><span>0 = not risky · 100 = extremely risky</span></label><label>How uneasy did you feel? <input id="emotion-rating" type="range" min="0" max="100" value="50"><span>0 = not uneasy · 100 = extremely uneasy</span></label></div><button id="next-month" class="button">Continue <span aria-hidden="true">&rarr;</span></button><p class="fine">The study would ask these same two state questions at shared quarter-end points in every condition.</p>`;
    screen.querySelector('#next-month').addEventListener('click', () => {
      ratings.push({ month, risk: Number(screen.querySelector('#risk-rating').value), unease: Number(screen.querySelector('#emotion-rating').value) });
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
    const meanUnease = ratings.length ? Math.round(ratings.reduce((sum, item) => sum + item.unease, 0) / ratings.length) : 0;
    screen.innerHTML = `<h2>Your choices, for reflection</h2><div class="result">Your final risky allocation was <strong>${terminalAllocation}%</strong>; average allocation at common quarter-end checkpoints was <strong>${meanQuarterAllocation}%</strong>. You made ${decisions.length} allocation decision${decisions.length === 1 ? '' : 's'}. Average reported unease was <strong>${meanUnease}/100</strong> across ${ratings.length} shared check-in point${ratings.length === 1 ? '' : 's'}.</div><p>These numbers describe only your choices in this short prototype. They are not a validated risk-tolerance score, a comparison with other people, or investment advice.</p><p class="fine">The proposed study's primary endpoint is terminal risky allocation, observed at the same horizon in every condition. The real study would compare randomized groups, not infer an effect from an individual demo run. Your responses were not saved or sent.</p><button id="again" class="button">Try another random condition <span aria-hidden="true">&rarr;</span></button><p><a href="/cases/check-in-effect.html">Read the research protocol &nearr;</a></p>`;
    screen.querySelector('#again').addEventListener('click', reset);
  }

  function reset() {
    month = 0;
    allocation = 50;
    portfolioWealth = 100;
    decisions.length = 0;
    ratings.length = 0;
    allocationByMonth.length = 0;
    portfolioValues.length = 0;
    assignment = assignCondition();
    showRound();
  }

  startButton.addEventListener('click', reset);
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
      startButton.disabled = false;
      startButton.textContent = 'Begin historical prototype →';
    })
    .catch(() => {
      startButton.disabled = true;
      screen.innerHTML = '<h2>Historical data unavailable</h2><p>Reload the page or open it from the hosted site. No answers have been collected.</p>';
    });
})();
