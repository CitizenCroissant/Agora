"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import styles from "./LegislativeProcessSteps.module.css";

export type Step = {
  title: string;
  body: string;
};

type Props = {
  steps: ReadonlyArray<Step>;
  nextLabel: string;
  prevLabel: string;
  showAllLabel: string;
};

export function LegislativeProcessSteps({
  steps,
  nextLabel,
  prevLabel,
  showAllLabel
}: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedAll, setExpandedAll] = useState(false);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  const totalSteps = steps.length;
  const visibleSteps = expandedAll ? totalSteps : currentStep;

  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    setExpandedAll(false);
  }, [totalSteps]);

  const goPrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setExpandedAll(false);
  }, []);

  const showAll = useCallback(() => {
    setExpandedAll(true);
    setCurrentStep(totalSteps);
  }, [totalSteps]);

  // When URL hash is #loi-step-N, expand steps and show that step (e.g. from diagram link)
  useEffect(() => {
    const applyHash = () => {
      const match = window.location.hash?.match(/^#loi-step-(\d+)$/);
      if (match) {
        const n = Math.min(Math.max(1, parseInt(match[1], 10)), totalSteps);
        setCurrentStep(n);
        setExpandedAll(true);
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [totalSteps]);

  useEffect(() => {
    if (visibleSteps > 0 && stepRefs.current[visibleSteps - 1]) {
      stepRefs.current[visibleSteps - 1]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [visibleSteps]);

  return (
    <div
      className={styles.wrapper}
      role="region"
      aria-label="Parcours du vote d'une loi"
    >
      <ol className={styles.stepsList} aria-label="Étapes">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isVisible = stepNumber <= visibleSteps;
          const isCurrent = stepNumber === currentStep && !expandedAll;

          return (
            <li
              key={stepNumber}
              id={`loi-step-${stepNumber}`}
              ref={(el) => {
                stepRefs.current[index] = el;
              }}
              className={
                isVisible
                  ? [styles.stepItem, isCurrent ? styles.stepItemCurrent : ""]
                      .join(" ")
                      .trim()
                  : styles.stepItemHidden
              }
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className={styles.stepCard}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {stepNumber}
                </span>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepBody}>{step.body}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className={styles.controls}>
        <div className={styles.buttonGroup}>
          <button
            type="button"
            onClick={goPrev}
            disabled={currentStep <= 1 && !expandedAll}
            className={styles.button}
            aria-label={prevLabel}
          >
            {prevLabel}
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={currentStep >= totalSteps && !expandedAll}
            className={styles.button}
            aria-label={nextLabel}
          >
            {nextLabel}
          </button>
        </div>
        {!expandedAll && (
          <button
            type="button"
            onClick={showAll}
            className={styles.showAllButton}
          >
            {showAllLabel}
          </button>
        )}
      </div>
    </div>
  );
}
