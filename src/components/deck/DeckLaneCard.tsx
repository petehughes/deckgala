import React from 'react';
import { useApp, useStopwatchState, useElapsedMs } from '../../context/AppContext';
import { getSwimmerNamesForLane } from '../../lib/lanes';
import { formatMs, formatShortSec } from '../../lib/format';
import type { LaneConfig } from '../../types';

export interface DeckLaneCardProps {
  laneConfig: LaneConfig;
}

export function DeckLaneCard({ laneConfig }: DeckLaneCardProps) {
  const { config } = useApp();
  const {
    stopwatch,
    handleStopSwimmer,
    handleReleaseNextInLane,
    handleScratchSwimmer
  } = useStopwatchState();
  const elapsedMs = useElapsedMs();

  const laneNum = laneConfig.lane;
  const names = getSwimmerNamesForLane(laneConfig);
  const laneRt = stopwatch.lanes[laneNum] || {
    nextWaveIndex: 0,
    nextWaveTimeMs: 0,
    activeSwimmers: []
  };
  const activeList = laneRt.activeSwimmers;
  const leadSwimmer = activeList[0] || null;

  // Next wave banner info
  let waveBannerText = 'All waves released';
  let waveBannerClass = 'deck-wave-banner';

  if (names.length === 0) {
    waveBannerText = 'No swimmers assigned';
  } else if (!stopwatch.isRunning && elapsedMs === 0) {
    waveBannerText = `${names.length} swimmer${names.length > 1 ? 's' : ''} ready (${laneConfig.interval}s int)`;
  } else if (laneRt.nextWaveIndex < names.length) {
    const nextName = names[laneRt.nextWaveIndex];
    if (config.stopwatchMode === 'interval' && laneRt.nextWaveTimeMs !== Infinity) {
      const remMs = Math.max(0, laneRt.nextWaveTimeMs - elapsedMs);
      waveBannerText = `Next: W${laneRt.nextWaveIndex + 1} ${nextName} in ${formatShortSec(remMs)}`;
      if (remMs <= 3200) {
        waveBannerClass = 'deck-wave-banner imminent';
      }
    } else {
      waveBannerText = `On block: W${laneRt.nextWaveIndex + 1} ${nextName}`;
    }
  } else {
    waveBannerText = `All ${names.length} waves out`;
  }

  const leadNetMs = leadSwimmer ? Math.max(0, elapsedMs - leadSwimmer.startTimeMs) : 0;

  // Release button calculation
  let isReleaseDisabled = false;
  let releaseBtnLabel = '+ Release Next Wave';

  if (names.length === 0) {
    isReleaseDisabled = true;
    releaseBtnLabel = 'No Swimmers Assigned';
  } else if (config.stopwatchMode === 'manual') {
    if (laneRt.nextWaveIndex >= names.length) {
      isReleaseDisabled = true;
      releaseBtnLabel = 'All Swimmers Released';
    } else {
      const candidateName = names[laneRt.nextWaveIndex];
      const candidateInWater = activeList.some(s => s.name.toLowerCase() === candidateName?.toLowerCase());
      if (candidateInWater) {
        isReleaseDisabled = true;
        releaseBtnLabel = `${candidateName} In Water`;
      } else {
        releaseBtnLabel = `+ Release ${candidateName}`;
      }
    }
  } else {
    const candidateName = names[laneRt.nextWaveIndex >= names.length ? 0 : laneRt.nextWaveIndex];
    const candidateInWater = candidateName
      ? activeList.some(s => s.name.toLowerCase() === candidateName.toLowerCase())
      : false;
    if (candidateInWater) {
      isReleaseDisabled = true;
      releaseBtnLabel = `${candidateName} In Water`;
    }
  }

  return (
    <div className="deck-lane-card">
      <div className="deck-lane-header">
        <div className="deck-lane-title">
          <span className="deck-lane-num">{laneNum}</span>
          <span>Lane {laneNum}</span>
        </div>
        <span className={waveBannerClass}>{waveBannerText}</span>
      </div>

      <div className="deck-lane-body">
        <button
          type="button"
          className={`primary-stop-btn ${leadSwimmer ? '' : 'idle'}`}
          disabled={!leadSwimmer}
          onClick={() => handleStopSwimmer(laneNum)}
        >
          {leadSwimmer ? (
            <>
              <span className="stop-btn-hint">TAP TO STOP FINISH</span>
              <span className="stop-swimmer-name">{leadSwimmer.name}</span>
              <span className="stop-swimmer-meta">
                Wave {leadSwimmer.wave} · Rep #{leadSwimmer.rep} (Started +{Math.round(leadSwimmer.startTimeMs / 1000)}s)
              </span>
              <span className="stop-live-timer">{formatMs(leadNetMs, true)}</span>
            </>
          ) : (
            <>
              <span className="stop-btn-hint">LANE {laneNum} CLEAR</span>
              <span className="stop-swimmer-name">Waiting for Wave</span>
              <span className="stop-swimmer-meta">
                Use &quot;Release Next Wave&quot; below to send a swimmer
              </span>
              <span className="stop-live-timer">--:--.--</span>
            </>
          )}
        </button>

        <div>
          <div className="queue-header">
            <span>IN WATER ({activeList.length})</span>
            <span>Tap row to stop out-of-order</span>
          </div>
          <div className="swimmer-queue-list">
            {activeList.map((sw, idx) => {
              const swNetMs = Math.max(0, elapsedMs - sw.startTimeMs);
              return (
                <div
                  key={sw.id}
                  className={`queue-item ${idx === 0 ? 'lead' : ''}`}
                  onClick={() => handleStopSwimmer(laneNum, sw.id)}
                >
                  <div className="queue-item-left">
                    <span className="queue-wave-tag">W{sw.wave}</span>
                    <span className="queue-swimmer-name">{sw.name}</span>
                  </div>
                  <div className="queue-item-right">
                    <span className="queue-item-time">{formatMs(swNetMs, true)}</span>
                    <button
                      type="button"
                      className="queue-scratch-btn"
                      title="Skip / Scratch swimmer"
                      onClick={e => {
                        e.stopPropagation();
                        handleScratchSwimmer(laneNum, sw.id);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="deck-lane-footer">
        <button
          type="button"
          className="lane-util-btn send-wave"
          disabled={isReleaseDisabled}
          onClick={() => handleReleaseNextInLane(laneNum)}
        >
          {releaseBtnLabel}
        </button>
      </div>
    </div>
  );
}

