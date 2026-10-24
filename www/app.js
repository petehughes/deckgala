tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
                    },
                    colors: {
                        pool: {
                            50: '#f0f9ff',
                            100: '#e0f2fe',
                            400: '#38bdf8',
                            500: '#0ea5e9',
                            600: '#0284c7',
                            700: '#0369a1',
                            900: '#0c4a6e',
                            950: '#082f49',
                        }
                    }
                }
            }
        }

/********************************************************************
         * AQUAPACE — OFFLINE CLUB SWIMMING WAVE & LANE STOPWATCH ENGINE
         ********************************************************************/
        const STORAGE_KEY = 'aquapace_club_swim_v1';

        function getDefaultClubData() {
            return {
                name: 'AquaPace Swim Club',
                groups: [
                    { id: 'grp_senior', name: 'Senior Performance', description: 'National and Regional squad qualifiers', color: 'cyan' },
                    { id: 'grp_junior', name: 'Junior Squad', description: 'County qualifiers and age-group competitors', color: 'blue' },
                    { id: 'grp_masters', name: 'Masters & Fitness', description: 'Adult lane swimmers and open water', color: 'emerald' },
                    { id: 'grp_dev', name: 'Development Squad', description: 'Technique, skills and aerobic foundation', color: 'amber' }
                ],
                swimmers: [
                    { id: 'sw_1', groupId: 'grp_senior', name: 'Alex Morgan', yob: 2007, gender: 'F', stroke: 'Freestyle', notes: '100m Free: 55.8s / 200m: 2:01.2s' },
                    { id: 'sw_2', groupId: 'grp_senior', name: 'Sam Jones', yob: 2006, gender: 'M', stroke: 'IM', notes: '200m IM: 2:08.4s / 100m Breast: 1:06.1s' },
                    { id: 'sw_3', groupId: 'grp_senior', name: 'Jordan Reed', yob: 2007, gender: 'M', stroke: 'Freestyle', notes: '50m Free: 23.9s / 100m Free: 52.4s' },
                    { id: 'sw_4', groupId: 'grp_senior', name: 'Taylor Swift', yob: 2008, gender: 'F', stroke: 'Backstroke', notes: '100m Back: 1:02.3s / 200m Back: 2:14.0s' },
                    { id: 'sw_5', groupId: 'grp_senior', name: 'Casey Brown', yob: 2007, gender: 'F', stroke: 'Butterfly', notes: '100m Fly: 1:01.8s / 50m Fly: 27.6s' },
                    { id: 'sw_6', groupId: 'grp_senior', name: 'Riley Davies', yob: 2006, gender: 'M', stroke: 'Freestyle', notes: '400m Free: 4:02.1s / 800m: 8:28.0s' },
                    { id: 'sw_7', groupId: 'grp_junior', name: 'Morgan Wright', yob: 2010, gender: 'F', stroke: 'Freestyle', notes: '100m Free: 1:01.2s' },
                    { id: 'sw_8', groupId: 'grp_junior', name: 'Jamie Hall', yob: 2011, gender: 'M', stroke: 'Breaststroke', notes: '100m Breast: 1:14.5s' },
                    { id: 'sw_9', groupId: 'grp_junior', name: 'Cameron Cole', yob: 2010, gender: 'M', stroke: 'Freestyle', notes: '100m Free: 1:03.0s' },
                    { id: 'sw_10', groupId: 'grp_junior', name: 'Drew Evans', yob: 2011, gender: 'F', stroke: 'Backstroke', notes: '100m Back: 1:12.8s' },
                    { id: 'sw_11', groupId: 'grp_junior', name: 'Devin Miller', yob: 2010, gender: 'M', stroke: 'Butterfly', notes: '100m Fly: 1:08.2s' },
                    { id: 'sw_12', groupId: 'grp_junior', name: 'Quinn Cooper', yob: 2011, gender: 'F', stroke: 'IM', notes: '200m IM: 2:32.4s' },
                    { id: 'sw_13', groupId: 'grp_masters', name: 'Avery Scott', yob: 1985, gender: 'M', stroke: 'Freestyle', notes: 'Threshold pace: 1:15/100m' },
                    { id: 'sw_14', groupId: 'grp_masters', name: 'Parker Green', yob: 1992, gender: 'F', stroke: 'Freestyle', notes: 'Pace: 1:20/100m' },
                    { id: 'sw_15', groupId: 'grp_masters', name: 'Reese Adams', yob: 1978, gender: 'M', stroke: 'Breaststroke', notes: 'Masters sprint specialist' },
                    { id: 'sw_16', groupId: 'grp_masters', name: 'Blake Wilson', yob: 1990, gender: 'F', stroke: 'Butterfly', notes: 'Open water & fly' },
                    { id: 'sw_17', groupId: 'grp_dev', name: 'Skyler Clark', yob: 2013, gender: 'M', stroke: 'Freestyle', notes: 'County dev squad' },
                    { id: 'sw_18', groupId: 'grp_dev', name: 'Frankie Baker', yob: 2014, gender: 'F', stroke: 'Backstroke', notes: 'Technique award' },
                    { id: 'sw_19', groupId: 'grp_dev', name: 'Hayden King', yob: 2013, gender: 'M', stroke: 'IM', notes: 'Turns & underwater focus' },
                    { id: 'sw_20', groupId: 'grp_dev', name: 'Rowen Patel', yob: 2014, gender: 'F', stroke: 'Freestyle', notes: 'Sprint development' }
                ]
            };
        }

        let swimmersUI = {
            activeGroupId: 'all',
            searchQuery: '',
            strokeFilter: 'all',
            sortOrder: 'name',
            pendingImport: null
        };

        // Application State
        let state = {
            currentView: 'setup', // 'setup' | 'deck' | 'results' | 'swimmers'
            soundEnabled: true,
            club: getDefaultClubData(),
            config: {
                laneCount: 4,
                mode: 'interval', // 'interval' | 'manual' | 'mass'
                intervalSeconds: 5,
                autoLaunchWaves: true,
                maxAutoWaves: 0, // 0 = unlimited
                setName: '10 x 100m Freestyle',
                targetTime: 65.0,
                poolCourse: '25m SCM',
                selectedGroupIds: ['grp_senior'],
                lanes: [
                    { id: 1, name: 'Lane 1', swimmersText: 'Alex Morgan, Sam Jones, Jordan Reed, Taylor Swift' },
                    { id: 2, name: 'Lane 2', swimmersText: 'Morgan Wright, Casey Brown, Riley Davies, Jamie Hall' },
                    { id: 3, name: 'Lane 3', swimmersText: 'Cameron Cole, Drew Evans, Devin Miller, Quinn Cooper' },
                    { id: 4, name: 'Lane 4', swimmersText: 'Avery Scott, Parker Green, Reese Adams, Blake Wilson' },
                    { id: 5, name: 'Lane 5', swimmersText: '' },
                    { id: 6, name: 'Lane 6', swimmersText: '' },
                    { id: 7, name: 'Lane 7', swimmersText: '' },
                    { id: 8, name: 'Lane 8', swimmersText: '' },
                    { id: 9, name: 'Lane 9', swimmersText: '' },
                    { id: 10, name: 'Lane 10', swimmersText: '' }
                ]
            },
            // Runtime Stopwatch State (High-precision timestamps)
            runtime: {
                isRunning: false,
                isPaused: false,
                masterStartPerf: 0,        // performance.now() when master started
                accumulatedPauseMs: 0,     // total ms spent paused
                pauseStartedPerf: 0,
                wavesLaunched: 0,
                nextAutoWaveAtMs: 5000,    // master elapsed ms for next automatic wave
                autoWavePaused: false,
                lastBeepSecond: null,
                // Active swimmers currently in the water:
                // Each entry: { uid, waveNum, laneId, laneName, swimmerName, waveStartMs }
                activeSwimmers: [],
                // Stack for undoing accidental stops or skips
                undoStack: []
            },
            // Completed & Recorded Swim Splits
            // Each entry: { id, setName, poolCourse, waveNum, laneId, laneName, swimmerName, waveStartMs, finishMasterMs, netTimeMs, targetTimeSec, timestampISO }
            results: []
        };

        let rafId = null;
        let audioCtx = null;

        /********************************************************************
         * WEB AUDIO API — SYNTHESIZED POOLSIDE BEEPS & STARTING HORN
         ********************************************************************/
        function ensureAudioContext() {
            if (!state.soundEnabled) return null;
            try {
                if (!audioCtx) {
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    audioCtx = new AudioContextClass();
                }
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
                return audioCtx;
            } catch (e) {
                return null;
            }
        }

        // Countdown pips ("3, 2, 1")
        function playCountdownPip() {
            const ctx = ensureAudioContext();
            if (!ctx) return;
            try {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 crisp beep
                gain.gain.setValueAtTime(0.18, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.095);
            } catch (e) {}
        }

        // Wave Departure Horn ("GO!")
        function playWaveLaunchHorn() {
            const ctx = ensureAudioContext();
            if (!ctx) return;
            try {
                const now = ctx.currentTime;
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gain = ctx.createGain();

                osc1.type = 'triangle';
                osc2.type = 'sawtooth';
                osc1.frequency.setValueAtTime(1318.5, now); // E6 energetic start tone
                osc2.frequency.setValueAtTime(659.25, now); // E5 undertone

                gain.gain.setValueAtTime(0.28, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(ctx.destination);

                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.34);
                osc2.stop(now + 0.34);
            } catch (e) {}
        }

        // Tactile Split Stop Click
        function playStopSplitClick() {
            const ctx = ensureAudioContext();
            if (!ctx) return;
            try {
                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1567.98, now); // G6 crisp confirmation
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.065);
            } catch (e) {}
        }

        /********************************************************************
         * PERSISTENCE (OFFLINE LOCALSTORAGE)
         ********************************************************************/
        function saveToStorage() {
            try {
                const payload = {
                    soundEnabled: state.soundEnabled,
                    config: state.config,
                    results: state.results,
                    club: state.club
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            } catch (err) {
                console.warn('Could not save state to localStorage:', err);
            }
        }

        function loadFromStorage() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) {
                    state.club = getDefaultClubData();
                    if (!Array.isArray(state.config.selectedGroupIds) || state.config.selectedGroupIds.length === 0) {
                        state.config.selectedGroupIds = state.club.groups.map(g => g.id);
                    }
                    return;
                }
                const parsed = JSON.parse(raw);
                if (typeof parsed.soundEnabled === 'boolean') state.soundEnabled = parsed.soundEnabled;
                if (parsed.config) {
                    state.config = { ...state.config, ...parsed.config };
                    // Ensure all 10 lane objects exist
                    if (!Array.isArray(state.config.lanes) || state.config.lanes.length < 10) {
                        for (let i = 1; i <= 10; i++) {
                            if (!state.config.lanes[i - 1]) {
                                state.config.lanes[i - 1] = { id: i, name: `Lane ${i}`, swimmersText: '' };
                            }
                        }
                    }
                }
                if (Array.isArray(parsed.results)) {
                    state.results = parsed.results;
                }
                if (parsed.club && Array.isArray(parsed.club.groups) && parsed.club.groups.length > 0) {
                    state.club = parsed.club;
                    state.club.swimmers = (state.club.swimmers || []).map((s, idx) => ({
                        id: s.id || `sw_${Date.now()}_${idx}`,
                        groupId: s.groupId || state.club.groups[0].id,
                        name: s.name || 'Unnamed Swimmer',
                        yob: s.yob || '',
                        gender: s.gender || '',
                        stroke: s.stroke || 'Freestyle',
                        notes: s.notes || ''
                    }));
                } else {
                    state.club = getDefaultClubData();
                }

                if (!Array.isArray(state.config.selectedGroupIds) || state.config.selectedGroupIds.length === 0) {
                    state.config.selectedGroupIds = state.club.groups.map(g => g.id);
                }
            } catch (err) {
                console.warn('Could not load saved state:', err);
                state.club = getDefaultClubData();
            }
        }

        /********************************************************************
         * TIME FORMATTING HELPERS
         ********************************************************************/
        // Format ms as MM:SS.d or SS.dd
        function formatClockMs(ms, decimals = 1) {
            if (ms < 0 || isNaN(ms)) ms = 0;
            const totalSeconds = ms / 1000;
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;

            const minStr = String(mins).padStart(2, '0');
            const secFormat = secs.toFixed(decimals).padStart(decimals === 2 ? 5 : 4, '0');
            return `${minStr}:${secFormat}`;
        }

        // Format net swim time cleanly (under 1 min shows SS.dd, 1 min+ shows M:SS.dd)
        function formatNetSwimMs(ms) {
            if (ms < 0 || isNaN(ms)) ms = 0;
            const totalSeconds = ms / 1000;
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            if (mins > 0) {
                return `${mins}:${secs.toFixed(2).padStart(5, '0')}`;
            }
            return `${secs.toFixed(2)}s`;
        }

        /********************************************************************
         * VIEW & SETUP MANAGEMENT
         ********************************************************************/
        function switchView(viewName) {
            state.currentView = viewName;

            const views = {
                setup: document.getElementById('viewSetup'),
                swimmers: document.getElementById('viewSwimmers'),
                deck: document.getElementById('viewDeck'),
                results: document.getElementById('viewResults')
            };
            const tabs = {
                setup: document.getElementById('tabBtnSetup'),
                swimmers: document.getElementById('tabBtnSwimmers'),
                deck: document.getElementById('tabBtnDeck'),
                results: document.getElementById('tabBtnResults')
            };

            Object.keys(views).forEach(k => {
                if (views[k] && tabs[k]) {
                    if (k === viewName) {
                        views[k].classList.remove('hidden');
                        tabs[k].className = 'px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm shrink-0';
                    } else {
                        views[k].classList.add('hidden');
                        tabs[k].className = 'px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shrink-0';
                    }
                }
            });

            if (viewName === 'setup') {
                renderSetupView();
            } else if (viewName === 'swimmers') {
                renderSwimmersView();
            } else if (viewName === 'deck') {
                renderDeckLanes();
                updateDeckHeaderUI();
            } else if (viewName === 'results') {
                populateResultsFilterDropdowns();
                renderResultsView();
            }
        }

        function setLaneCount(count) {
            state.config.laneCount = Math.max(1, Math.min(10, parseInt(count, 10) || 4));
            saveToStorage();
            renderSetupView();
            updateHeaderSummary();
        }

        function setStopwatchMode(mode) {
            state.config.mode = mode;
            saveToStorage();
            renderSetupView();
            updateHeaderSummary();
        }

        function setIntervalSeconds(sec) {
            const parsed = Math.max(2, Math.min(600, parseInt(sec, 10) || 5));
            state.config.intervalSeconds = parsed;
            document.getElementById('customIntervalInput').value = parsed;
            saveToStorage();
            renderSetupView();
            updateHeaderSummary();
        }

        function applySetPreset(presetText) {
            document.getElementById('setNameInput').value = presetText;
            updateConfigFromInputs();
        }

        function updateConfigFromInputs() {
            state.config.setName = document.getElementById('setNameInput').value.trim() || 'Club Training Set';
            const tVal = parseFloat(document.getElementById('targetTimeInput').value);
            state.config.targetTime = isNaN(tVal) || tVal <= 0 ? 0 : tVal;
            state.config.poolCourse = document.getElementById('poolLengthSelect').value;
            state.config.autoLaunchWaves = document.getElementById('autoLaunchToggle').checked;
            state.config.maxAutoWaves = Math.max(0, parseInt(document.getElementById('maxAutoWavesInput').value, 10) || 0);
            saveToStorage();
            updateHeaderSummary();
        }

        function updateLaneConfig(index, field, value) {
            if (!state.config.lanes[index]) return;
            state.config.lanes[index][field] = value;
            saveToStorage();
        }

/********************************************************************
         * SESSION SQUADS & LANE SWIMMERS ASSIGNMENT (SETUP VIEW)
         ********************************************************************/
        function getGroupColorClasses(color) {
            const map = {
                cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/40', dot: 'bg-cyan-500' },
                blue: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/40', dot: 'bg-blue-500' },
                emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/40', dot: 'bg-emerald-500' },
                amber: { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/40', dot: 'bg-amber-500' },
                purple: { bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/40', dot: 'bg-purple-500' },
                rose: { bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/40', dot: 'bg-rose-500' }
            };
            return map[color] || map.cyan;
        }

        function getGroupName(groupId) {
            if (!state.club || !Array.isArray(state.club.groups)) return 'Squad';
            const grp = state.club.groups.find(g => g.id === groupId);
            return grp ? grp.name : 'Squad';
        }

        function getSessionSwimmersPool() {
            if (!state.club || !Array.isArray(state.club.swimmers)) return [];
            const selectedIds = new Set(state.config.selectedGroupIds || []);
            return state.club.swimmers.filter(s => selectedIds.has(s.groupId));
        }

        function toggleSessionGroup(groupId) {
            let list = state.config.selectedGroupIds || [];
            if (list.includes(groupId)) {
                list = list.filter(id => id !== groupId);
            } else {
                list = [...list, groupId];
            }
            state.config.selectedGroupIds = list;
            saveToStorage();
            renderSetupView();
        }

        function selectAllSessionGroups() {
            state.config.selectedGroupIds = (state.club.groups || []).map(g => g.id);
            saveToStorage();
            renderSetupView();
            showToast('All squads selected for this session');
        }

        function clearSessionGroups() {
            state.config.selectedGroupIds = [];
            saveToStorage();
            renderSetupView();
            showToast('Cleared session squads');
        }

        function addSwimmerToLane(laneIndex, swimmerName) {
            if (!swimmerName) return;
            const lane = state.config.lanes[laneIndex];
            if (!lane) return;
            const currentNames = (lane.swimmersText || '').split(',').map(s => s.trim()).filter(Boolean);
            currentNames.push(swimmerName);
            lane.swimmersText = currentNames.join(', ');
            saveToStorage();
            renderSetupView();
        }

        function removeSwimmerFromLane(laneIndex, waveIndex) {
            const lane = state.config.lanes[laneIndex];
            if (!lane) return;
            const currentNames = (lane.swimmersText || '').split(',').map(s => s.trim()).filter(Boolean);
            if (waveIndex >= 0 && waveIndex < currentNames.length) {
                currentNames.splice(waveIndex, 1);
                lane.swimmersText = currentNames.join(', ');
                saveToStorage();
                renderSetupView();
            }
        }

        function clearLaneSwimmers(laneIndex) {
            const lane = state.config.lanes[laneIndex];
            if (!lane) return;
            lane.swimmersText = '';
            saveToStorage();
            renderSetupView();
        }

        function toggleLaneDirectEdit(laneIndex) {
            const container = document.getElementById(`laneTextInputContainer_${laneIndex}`);
            if (container) {
                container.classList.toggle('hidden');
            }
        }

        function autoDistributeSessionSwimmers() {
            const pool = getSessionSwimmersPool();
            if (pool.length === 0) {
                showToast('No swimmers found in selected session squads. Select at least one squad with swimmers.');
                return;
            }
            const laneCount = state.config.laneCount;
            // Clear active lanes
            for (let i = 0; i < laneCount; i++) {
                state.config.lanes[i].swimmersText = '';
            }
            // Distribute round-robin across active lanes
            pool.forEach((swimmer, idx) => {
                const laneIdx = idx % laneCount;
                const existing = state.config.lanes[laneIdx].swimmersText;
                state.config.lanes[laneIdx].swimmersText = existing ? `${existing}, ${swimmer.name}` : swimmer.name;
            });
            saveToStorage();
            renderSetupView();
            showToast(`Assigned ${pool.length} swimmers across ${laneCount} active lanes`);
        }

        function clearAllLaneSwimmers() {
            for (let i = 0; i < 10; i++) {
                state.config.lanes[i].swimmersText = '';
            }
            saveToStorage();
            renderSetupView();
            showToast('Cleared swimmers from all lanes');
        }

        function renderSetupView() {
            // Sync inputs
            document.getElementById('setNameInput').value = state.config.setName;
            document.getElementById('targetTimeInput').value = state.config.targetTime || '';
            document.getElementById('poolLengthSelect').value = state.config.poolCourse;
            document.getElementById('customIntervalInput').value = state.config.intervalSeconds;
            document.getElementById('autoLaunchToggle').checked = state.config.autoLaunchWaves;
            document.getElementById('maxAutoWavesInput').value = state.config.maxAutoWaves || 0;
            document.getElementById('laneCountDisplay').textContent = `${state.config.laneCount} ${state.config.laneCount === 1 ? 'Lane' : 'Lanes'}`;
            document.getElementById('intervalValueBadge').textContent = `Every ${state.config.intervalSeconds} Seconds`;

            // Highlight active lane count pill
            const laneBtns = document.querySelectorAll('.lane-count-btn');
            laneBtns.forEach((btn, idx) => {
                const count = idx + 1;
                if (count === state.config.laneCount) {
                    btn.className = 'lane-count-btn py-2.5 rounded-xl font-mono font-extrabold text-sm border-2 border-cyan-500 bg-cyan-500 text-slate-950 shadow-sm transition';
                } else {
                    btn.className = 'lane-count-btn py-2.5 rounded-xl font-mono font-bold text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-cyan-500/50 transition';
                }
            });

            // Highlight active mode card
            const modes = {
                interval: document.getElementById('modeCardInterval'),
                manual: document.getElementById('modeCardManual'),
                mass: document.getElementById('modeCardMass')
            };
            Object.keys(modes).forEach(k => {
                if (k === state.config.mode) {
                    modes[k].className = 'mode-card text-left p-3.5 rounded-xl border-2 border-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/10 shadow-sm transition flex flex-col justify-between';
                } else {
                    modes[k].className = 'mode-card text-left p-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:border-slate-400 transition flex flex-col justify-between opacity-80';
                }
            });

            // Interval Config visibility
            const intervalPanel = document.getElementById('intervalConfigPanel');
            if (state.config.mode === 'interval') {
                intervalPanel.classList.remove('opacity-50');
            } else {
                intervalPanel.classList.add('opacity-50');
            }

            // Highlight preset interval seconds
            const presetSecs = [5, 10, 15, 30, 45, 60];
            const intervalBtns = document.querySelectorAll('.interval-preset-btn');
            intervalBtns.forEach((btn, idx) => {
                if (presetSecs[idx] === state.config.intervalSeconds) {
                    btn.className = 'interval-preset-btn py-2.5 px-3 rounded-xl font-mono font-extrabold text-sm border-2 border-cyan-500 bg-cyan-500 text-slate-950 transition';
                } else {
                    btn.className = 'interval-preset-btn py-2.5 px-3 rounded-xl font-mono font-bold text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-cyan-500/50 transition';
                }
            });

            // Render Session Squads selector
            const groupsContainer = document.getElementById('sessionGroupsSelector');
            if (groupsContainer) {
                groupsContainer.innerHTML = '';
                const selectedSet = new Set(state.config.selectedGroupIds || []);
                (state.club.groups || []).forEach(grp => {
                    const isChecked = selectedSet.has(grp.id);
                    const colorCls = getGroupColorClasses(grp.color);
                    const count = (state.club.swimmers || []).filter(s => s.groupId === grp.id).length;

                    const label = document.createElement('label');
                    label.className = `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border cursor-pointer transition select-none ${
                        isChecked
                            ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-900 dark:text-cyan-200 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 opacity-80 hover:opacity-100'
                    }`;
                    label.innerHTML = `
                        <input type="checkbox" onchange="toggleSessionGroup('${grp.id}')" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500">
                        <span class="w-2.5 h-2.5 rounded-full ${colorCls.dot}"></span>
                        <span class="text-xs font-bold">${escapeHtml(grp.name)}</span>
                        <span class="px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-bold">${count}</span>
                    `;
                    groupsContainer.appendChild(label);
                });

                // Update session pool badge
                const pool = getSessionSwimmersPool();
                const poolBadge = document.getElementById('sessionSwimmersCountBadge');
                if (poolBadge) {
                    poolBadge.textContent = `${pool.length} Swimmer${pool.length === 1 ? '' : 's'} Available`;
                }
            }

            // Render Lane Setup Cards for active lane count
            const grid = document.getElementById('laneSetupGrid');
            if (grid) {
                grid.innerHTML = '';
                const pool = getSessionSwimmersPool();
                const sortedPool = [...pool].sort((a, b) => a.name.localeCompare(b.name));

                for (let i = 0; i < state.config.laneCount; i++) {
                    const lane = state.config.lanes[i];
                    const assignedSwimmers = (lane.swimmersText || '').split(',').map(s => s.trim()).filter(Boolean);

                    const card = document.createElement('div');
                    card.className = 'p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3';

                    // Build chips for assigned swimmers
                    let chipsHtml = '';
                    if (assignedSwimmers.length === 0) {
                        chipsHtml = `<div class="text-[11px] text-slate-400 italic py-1">No swimmers assigned (Wave 1, 2...)</div>`;
                    } else {
                        chipsHtml = `<div class="flex flex-wrap gap-1.5">` + assignedSwimmers.map((name, wIdx) => `
                            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30 text-xs font-semibold">
                                <span class="font-mono text-[10px] font-extrabold text-cyan-600 dark:text-cyan-400">W${wIdx + 1}:</span>
                                <span class="truncate max-w-[110px]" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
                                <button type="button" onclick="removeSwimmerFromLane(${i}, ${wIdx})" title="Remove swimmer" class="text-slate-400 hover:text-rose-500 font-bold ml-0.5 text-xs">&times;</button>
                            </span>
                        `).join('') + `</div>`;
                    }

                    // Options for dropdown
                    let dropdownOptions = `<option value="">+ Add Swimmer (Wave ${assignedSwimmers.length + 1})...</option>`;
                    sortedPool.forEach(swimmer => {
                        const grpName = getGroupName(swimmer.groupId);
                        dropdownOptions += `<option value="${escapeHtml(swimmer.name)}">${escapeHtml(swimmer.name)} (${escapeHtml(grpName)})</option>`;
                    });

                    card.innerHTML = `
                        <div>
                            <div class="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-700/60">
                                <span class="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-mono font-extrabold text-xs">LANE #${i + 1}</span>
                                <input type="text" value="${escapeHtml(lane.name)}" oninput="updateLaneConfig(${i}, 'name', this.value)"
                                    class="w-32 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-right focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    placeholder="Lane ${i + 1}">
                            </div>

                            <div class="pt-2">
                                <label class="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Waves Swimmer Order:</label>
                                ${chipsHtml}
                            </div>
                        </div>

                        <div class="pt-2 border-t border-slate-200/60 dark:border-slate-700/50 space-y-2">
                            <!-- Swimmer picker dropdown -->
                            <div class="flex items-center gap-1.5">
                                <select onchange="addSwimmerToLane(${i}, this.value); this.value='';" class="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500">
                                    ${dropdownOptions}
                                </select>
                            </div>

                            <!-- Lane quick actions -->
                            <div class="flex items-center justify-between text-[11px] pt-1">
                                <button type="button" onclick="toggleLaneDirectEdit(${i})" class="text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 font-bold transition">
                                    Direct Text Edit
                                </button>
                                ${assignedSwimmers.length > 0 ? `<button type="button" onclick="clearLaneSwimmers(${i})" class="text-rose-500 hover:underline font-bold">Clear</button>` : ''}
                            </div>

                            <!-- Direct comma-separated input toggle -->
                            <div id="laneTextInputContainer_${i}" class="hidden pt-1">
                                <input type="text" value="${escapeHtml(lane.swimmersText)}" oninput="updateLaneConfig(${i}, 'swimmersText', this.value)"
                                    placeholder="Comma-separated: Alex, Sam, Jordan"
                                    class="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500">
                            </div>
                        </div>
                    `;
                    grid.appendChild(card);
                }
            }
        }

                function saveSetupAndGoToDeck() {
            updateConfigFromInputs();
            ensureAudioContext();
            switchView('deck');
        }

        function updateHeaderSummary() {
            const modeText = state.config.mode === 'interval'
                ? `Go Every ${state.config.intervalSeconds}s`
                : state.config.mode === 'manual'
                    ? 'Manual Wave Launch'
                    : 'Mass Start';
            document.getElementById('headerSetSubtitle').textContent =
                `${state.config.laneCount} ${state.config.laneCount === 1 ? 'Lane' : 'Lanes'} • ${modeText} • ${state.config.setName}`;

            // Badges
            const activeCount = state.runtime.activeSwimmers.length;
            const activeBadge = document.getElementById('activeSwimmersBadge');
            if (activeCount > 0) {
                activeBadge.textContent = activeCount;
                activeBadge.classList.remove('hidden');
            } else {
                activeBadge.classList.add('hidden');
            }

            const swimmersBadge = document.getElementById('swimmersCountBadge');
            if (swimmersBadge && state.club && Array.isArray(state.club.swimmers)) {
                swimmersBadge.textContent = state.club.swimmers.length;
            }

            document.getElementById('resultsCountBadge').textContent = state.results.length;
        }

        /********************************************************************
         * STOPWATCH TIMING ENGINE & WAVE MANAGER
         ********************************************************************/
        function getMasterElapsedMs() {
            if (!state.runtime.isRunning) return 0;
            if (state.runtime.isPaused) {
                return state.runtime.pauseStartedPerf - state.runtime.masterStartPerf - state.runtime.accumulatedPauseMs;
            }
            return performance.now() - state.runtime.masterStartPerf - state.runtime.accumulatedPauseMs;
        }

        function getSwimmerLabelForWave(laneIndex, waveNumber) {
            const lane = state.config.lanes[laneIndex];
            if (!lane || !lane.swimmersText.trim()) {
                return `Wave ${waveNumber}`;
            }
            const names = lane.swimmersText.split(',').map(s => s.trim()).filter(Boolean);
            if (names.length === 0) return `Wave ${waveNumber}`;
            // Cycle through roster if more waves are launched than names listed (e.g., multiple reps)
            const chosenName = names[(waveNumber - 1) % names.length];
            const repCycle = Math.floor((waveNumber - 1) / names.length) + 1;
            return repCycle > 1 ? `${chosenName} (R${repCycle})` : chosenName;
        }

        // Primary Green Action Button Handler
        function handlePrimaryWaveButton() {
            ensureAudioContext();

            if (!state.runtime.isRunning) {
                // Start Master Clock and immediately launch Wave #1 at 00:00.00
                state.runtime.isRunning = true;
                state.runtime.isPaused = false;
                state.runtime.masterStartPerf = performance.now();
                state.runtime.accumulatedPauseMs = 0;
                state.runtime.wavesLaunched = 0;
                state.runtime.lastBeepSecond = null;
                state.runtime.autoWavePaused = false;

                launchWaveAtExactMs(0);
                state.runtime.nextAutoWaveAtMs = state.config.intervalSeconds * 1000;

                startAnimationLoop();
                updateDeckHeaderUI();
                return;
            }

            if (state.runtime.isPaused) {
                toggleMasterPause();
                return;
            }

            // If already running, pressing primary button launches the next wave immediately
            launchWaveNow('manual');
        }

        // Launch a wave right now across all active lanes
        function launchWaveNow(source = 'manual') {
            if (!state.runtime.isRunning) {
                handlePrimaryWaveButton();
                return;
            }
            const currentMs = getMasterElapsedMs();
            launchWaveAtExactMs(currentMs);

            // If launched manually during interval mode, schedule the next interval from this wave
            if (state.config.mode === 'interval') {
                state.runtime.nextAutoWaveAtMs = currentMs + (state.config.intervalSeconds * 1000);
                state.runtime.lastBeepSecond = null;
            }
        }

        // Launch a new swimmer only for a single specific lane
        function launchSingleLaneSwimmer(laneIndex) {
            if (!state.runtime.isRunning) {
                handlePrimaryWaveButton();
                return;
            }
            const currentMs = getMasterElapsedMs();
            const lane = state.config.lanes[laneIndex];
            const waveNum = state.runtime.wavesLaunched || 1;
            const swimmerName = getSwimmerLabelForWave(laneIndex, waveNum);

            state.runtime.activeSwimmers.push({
                uid: `sw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                waveNum: waveNum,
                laneId: lane.id,
                laneIndex: laneIndex,
                laneName: lane.name || `Lane ${lane.id}`,
                swimmerName: swimmerName,
                waveStartMs: currentMs
            });

            playCountdownPip();
            renderDeckLanes();
            updateHeaderSummary();
        }

        function launchWaveAtExactMs(exactStartMs) {
            state.runtime.wavesLaunched += 1;
            const waveNum = state.runtime.wavesLaunched;

            for (let i = 0; i < state.config.laneCount; i++) {
                const lane = state.config.lanes[i];
                const swimmerName = getSwimmerLabelForWave(i, waveNum);
                state.runtime.activeSwimmers.push({
                    uid: `sw_${waveNum}_${i}_${Date.now()}`,
                    waveNum: waveNum,
                    laneId: lane.id,
                    laneIndex: i,
                    laneName: lane.name || `Lane ${lane.id}`,
                    swimmerName: swimmerName,
                    waveStartMs: exactStartMs
                });
            }

            // Audio & Visual Flash on Wave Launch
            playWaveLaunchHorn();
            const banner = document.getElementById('masterDeckBanner');
            banner.classList.remove('flash-go');
            void banner.offsetWidth; // trigger reflow
            banner.classList.add('flash-go');

            renderDeckLanes();
            updateDeckHeaderUI();
            updateHeaderSummary();
        }

        function startAnimationLoop() {
            if (rafId) cancelAnimationFrame(rafId);

            function tick() {
                if (!state.runtime.isRunning) return;

                const elapsedMs = getMasterElapsedMs();

                // 1. Update Master Clock Display
                document.getElementById('masterClockDisplay').textContent = formatClockMs(elapsedMs, 1);

                // 2. Handle Interval Wave Countdown & Auto-Launch
                if (state.config.mode === 'interval' && !state.runtime.isPaused) {
                    const maxCapReached = state.config.maxAutoWaves > 0 && state.runtime.wavesLaunched >= state.config.maxAutoWaves;

                    if (!state.runtime.autoWavePaused && !maxCapReached) {
                        const remainingMs = state.runtime.nextAutoWaveAtMs - elapsedMs;

                        // Play 3, 2, 1 countdown beeps when interval >= 4 seconds
                        if (state.config.intervalSeconds >= 4 && remainingMs > 0 && remainingMs <= 3050) {
                            const secCeil = Math.ceil(remainingMs / 1000);
                            if (secCeil >= 1 && secCeil <= 3 && state.runtime.lastBeepSecond !== secCeil) {
                                state.runtime.lastBeepSecond = secCeil;
                                playCountdownPip();
                            }
                        }

                        if (remainingMs <= 0) {
                            if (state.config.autoLaunchWaves) {
                                // Launch Wave at exact scheduled timestamp so there is zero drift
                                const scheduledMs = state.runtime.nextAutoWaveAtMs;
                                launchWaveAtExactMs(scheduledMs);
                                state.runtime.nextAutoWaveAtMs = scheduledMs + (state.config.intervalSeconds * 1000);
                                state.runtime.lastBeepSecond = null;
                            } else {
                                // Roll over countdown cue even if coach chooses manual button tap
                                state.runtime.nextAutoWaveAtMs += (state.config.intervalSeconds * 1000);
                                state.runtime.lastBeepSecond = null;
                            }
                        }

                        const updatedRemMs = Math.max(0, state.runtime.nextAutoWaveAtMs - elapsedMs);
                        document.getElementById('nextWaveCountdownDisplay').textContent = `${(updatedRemMs / 1000).toFixed(1)}s`;

                        const pct = Math.max(0, Math.min(100, (updatedRemMs / (state.config.intervalSeconds * 1000)) * 100));
                        document.getElementById('intervalProgressBar').style.width = `${pct}%`;
                    } else if (maxCapReached) {
                        document.getElementById('nextWaveCountdownDisplay').textContent = 'CAP DONE';
                        document.getElementById('intervalProgressBar').style.width = '0%';
                    }
                }

                // 3. Live-update each active swimmer's individual net elapsed time on their lane card
                const liveTimers = document.querySelectorAll('[data-swimmer-start-ms]');
                liveTimers.forEach(el => {
                    const startMs = parseFloat(el.getAttribute('data-swimmer-start-ms')) || 0;
                    const netMs = Math.max(0, elapsedMs - startMs);
                    el.textContent = formatNetSwimMs(netMs);
                });

                rafId = requestAnimationFrame(tick);
            }

            rafId = requestAnimationFrame(tick);
        }

        function toggleMasterPause() {
            if (!state.runtime.isRunning) return;
            if (!state.runtime.isPaused) {
                state.runtime.isPaused = true;
                state.runtime.pauseStartedPerf = performance.now();
                showToast('Master Clock Paused');
            } else {
                state.runtime.accumulatedPauseMs += (performance.now() - state.runtime.pauseStartedPerf);
                state.runtime.isPaused = false;
                showToast('Master Clock Resumed');
            }
            updateDeckHeaderUI();
        }

        function toggleAutoWavePause() {
            state.runtime.autoWavePaused = !state.runtime.autoWavePaused;
            if (!state.runtime.autoWavePaused && state.runtime.isRunning) {
                // Re-sync next auto wave relative to current master clock
                state.runtime.nextAutoWaveAtMs = getMasterElapsedMs() + (state.config.intervalSeconds * 1000);
            }
            updateDeckHeaderUI();
        }

        /********************************************************************
         * STOPPING INDIVIDUAL SWIMMERS & RECORDING SPLITS
         ********************************************************************/
        function stopSwimmerByUid(uid) {
            const idx = state.runtime.activeSwimmers.findIndex(s => s.uid === uid);
            if (idx === -1) return;

            const finishMasterMs = getMasterElapsedMs();
            const swimmer = state.runtime.activeSwimmers[idx];
            const netTimeMs = Math.max(0, finishMasterMs - swimmer.waveStartMs);

            // Remove from active pool queue
            state.runtime.activeSwimmers.splice(idx, 1);

            const record = {
                id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                setName: state.config.setName,
                poolCourse: state.config.poolCourse,
                waveNum: swimmer.waveNum,
                laneId: swimmer.laneId,
                laneIndex: swimmer.laneIndex,
                laneName: swimmer.laneName,
                swimmerName: swimmer.swimmerName,
                waveStartMs: swimmer.waveStartMs,
                finishMasterMs: finishMasterMs,
                netTimeMs: netTimeMs,
                targetTimeSec: state.config.targetTime || 0,
                timestampISO: new Date().toISOString()
            };

            state.results.unshift(record);

            // Push to Undo Stack
            state.runtime.undoStack.push({
                type: 'stop',
                swimmer: swimmer,
                recordId: record.id
            });

            playStopSplitClick();
            saveToStorage();
            renderDeckLanes();
            updateDeckHeaderUI();
            updateHeaderSummary();
        }

        // Skip / Scratch a swimmer if they didn't push off or pulled out of the lane
        function scratchSwimmerByUid(uid, event) {
            if (event) event.stopPropagation();
            const idx = state.runtime.activeSwimmers.findIndex(s => s.uid === uid);
            if (idx === -1) return;
            const removed = state.runtime.activeSwimmers.splice(idx, 1)[0];

            state.runtime.undoStack.push({
                type: 'scratch',
                swimmer: removed
            });

            renderDeckLanes();
            updateDeckHeaderUI();
            updateHeaderSummary();
            showToast(`Scratched ${removed.swimmerName} (${removed.laneName})`);
        }

        function undoLastAction() {
            if (state.runtime.undoStack.length === 0) return;
            const last = state.runtime.undoStack.pop();

            if (last.type === 'stop') {
                // Remove from recorded results
                state.results = state.results.filter(r => r.id !== last.recordId);
                // Put swimmer back into active water queue sorted by waveStartMs
                state.runtime.activeSwimmers.push(last.swimmer);
                state.runtime.activeSwimmers.sort((a, b) => a.waveStartMs - b.waveStartMs);
                showToast(`Restored ${last.swimmer.swimmerName} (${last.swimmer.laneName}) to active swim`);
            } else if (last.type === 'scratch') {
                state.runtime.activeSwimmers.push(last.swimmer);
                state.runtime.activeSwimmers.sort((a, b) => a.waveStartMs - b.waveStartMs);
                showToast(`Restored scratched swimmer ${last.swimmer.swimmerName}`);
            }

            saveToStorage();
            renderDeckLanes();
            updateDeckHeaderUI();
            updateHeaderSummary();
        }

        /********************************************************************
         * RENDER POOL DECK UI & LANE CARDS
         ********************************************************************/
        function updateDeckHeaderUI() {
            const dot = document.getElementById('clockStatusDot');
            const primaryText = document.getElementById('primaryWaveActionText');
            const manualBoostBtn = document.getElementById('manualWaveBoostBtn');
            const pauseMasterBtn = document.getElementById('pauseMasterBtn');
            const undoBtn = document.getElementById('undoLastStopBtn');
            const wavesPill = document.getElementById('totalWavesLaunchedPill');
            const nextWaveHint = document.getElementById('nextWaveNumberHint');
            const pauseAutoBtn = document.getElementById('pauseAutoWaveBtn');
            const countdownLabel = document.getElementById('countdownModeLabel');
            const countdownDisplay = document.getElementById('nextWaveCountdownDisplay');

            wavesPill.textContent = `${state.runtime.wavesLaunched} ${state.runtime.wavesLaunched === 1 ? 'Wave' : 'Waves'} Sent`;
            nextWaveHint.textContent = `Next: Wave #${state.runtime.wavesLaunched + 1}`;
            undoBtn.disabled = state.runtime.undoStack.length === 0;

            if (state.config.mode === 'interval') {
                countdownLabel.textContent = `Next Wave (Go Every ${state.config.intervalSeconds}s)`;
                pauseAutoBtn.classList.remove('hidden');
                pauseAutoBtn.textContent = state.runtime.autoWavePaused ? 'Auto: PAUSED' : 'Auto: ON';
                pauseAutoBtn.className = state.runtime.autoWavePaused
                    ? 'text-[11px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 transition'
                    : 'text-[11px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 transition';
                if (!state.runtime.isRunning) {
                    countdownDisplay.textContent = `${state.config.intervalSeconds.toFixed(1)}s`;
                    document.getElementById('intervalProgressBar').style.width = '100%';
                }
            } else if (state.config.mode === 'manual') {
                countdownLabel.textContent = 'Manual Wave Send-Off Mode';
                pauseAutoBtn.classList.add('hidden');
                countdownDisplay.textContent = 'ON CUE';
                document.getElementById('intervalProgressBar').style.width = '100%';
            } else {
                countdownLabel.textContent = 'Simultaneous / Mass Start Mode';
                pauseAutoBtn.classList.add('hidden');
                countdownDisplay.textContent = 'MASS';
                document.getElementById('intervalProgressBar').style.width = '100%';
            }

            if (!state.runtime.isRunning) {
                dot.className = 'w-2.5 h-2.5 rounded-full bg-slate-400';
                primaryText.textContent = 'START & LAUNCH W1';
                manualBoostBtn.disabled = true;
                pauseMasterBtn.disabled = true;
                pauseMasterBtn.textContent = 'Pause';
            } else if (state.runtime.isPaused) {
                dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping';
                primaryText.textContent = 'RESUME CLOCK';
                manualBoostBtn.disabled = true;
                pauseMasterBtn.disabled = false;
                pauseMasterBtn.textContent = 'Resume';
            } else {
                dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse';
                primaryText.textContent = `LAUNCH WAVE #${state.runtime.wavesLaunched + 1}`;
                manualBoostBtn.disabled = false;
                pauseMasterBtn.disabled = false;
                pauseMasterBtn.textContent = 'Pause';
            }

            // Update Recent Splits Ticker (last 4 finishes)
            const ticker = document.getElementById('recentSplitsTicker');
            if (state.results.length === 0) {
                ticker.innerHTML = `<span class="text-slate-400 italic">No swimmers stopped yet — tap any lane card as swimmers touch the wall.</span>`;
            } else {
                ticker.innerHTML = state.results.slice(0, 5).map(r => `
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium shrink-0">
                        <span class="font-bold text-cyan-600 dark:text-cyan-400">${escapeHtml(r.laneName)}</span>
                        <span class="text-slate-500 dark:text-slate-400">W${r.waveNum} (${escapeHtml(r.swimmerName)}):</span>
                        <span class="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">${formatNetSwimMs(r.netTimeMs)}</span>
                    </span>
                `).join('');
            }
        }

        function renderDeckLanes() {
            const grid = document.getElementById('lanesDeckGrid');
            if (!grid) return;

            // Adjust responsive grid columns based on lane count
            const count = state.config.laneCount;
            if (count <= 2) {
                grid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1';
            } else if (count === 3) {
                grid.className = 'grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1';
            } else if (count <= 4) {
                grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 flex-1';
            } else {
                grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 flex-1';
            }

            grid.innerHTML = '';
            const currentMasterMs = getMasterElapsedMs();

            for (let i = 0; i < count; i++) {
                const lane = state.config.lanes[i];
                const laneSwimmers = state.runtime.activeSwimmers
                    .filter(s => s.laneIndex === i)
                    .sort((a, b) => a.waveStartMs - b.waveStartMs);

                const laneSplits = state.results.filter(r => r.laneIndex === i);
                const lastSplit = laneSplits[0] || null;

                const leadSwimmer = laneSwimmers[0] || null;
                const followingSwimmers = laneSwimmers.slice(1);

                const card = document.createElement('div');
                card.className = 'bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden transition';

                // Top Header of Lane Card
                let headerHtml = `
                    <div class="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 font-mono font-extrabold text-sm flex items-center justify-center">${i + 1}</span>
                            <div>
                                <h3 class="font-extrabold text-sm leading-tight">${escapeHtml(lane.name || 'Lane ' + (i + 1))}</h3>
                                <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">${laneSwimmers.length} in water • ${laneSplits.length} finished</span>
                            </div>
                        </div>
                        <button onclick="launchSingleLaneSwimmer(${i})" title="Launch an extra swimmer in this lane now" class="px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-700/80 hover:bg-cyan-500 hover:text-slate-950 text-[11px] font-extrabold transition">
                            +1 Swim
                        </button>
                    </div>
                `;

                // Primary Lead Swimmer Touch Button (Huge Touch Target for Poolside Stopping)
                let bodyHtml = '';
                if (leadSwimmer) {
                    const initialNetMs = Math.max(0, currentMasterMs - leadSwimmer.waveStartMs);
                    bodyHtml += `
                        <div class="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                            <div onclick="stopSwimmerByUid('${leadSwimmer.uid}')" role="button" tabindex="0"
                                class="w-full flex-1 min-h-[135px] p-4 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.97] text-white shadow-md shadow-cyan-500/20 flex flex-col justify-between cursor-pointer transition relative overflow-hidden">
                                
                                <div class="flex items-center justify-between gap-1">
                                    <span class="px-2.5 py-0.5 rounded-md bg-slate-950/35 backdrop-blur-sm font-mono font-extrabold text-xs uppercase tracking-wider">
                                        WAVE #${leadSwimmer.waveNum} • NEXT AT WALL
                                    </span>
                                    <button type="button" onclick="scratchSwimmerByUid('${leadSwimmer.uid}', event)" title="Scratch / Skip this swimmer"
                                        class="px-2 py-0.5 rounded bg-slate-950/25 hover:bg-rose-500 text-[11px] font-bold transition">
                                        Skip ✕
                                    </button>
                                </div>

                                <div class="my-2 text-center">
                                    <div class="text-sm font-bold opacity-95 truncate">${escapeHtml(leadSwimmer.swimmerName)}</div>
                                    <div data-swimmer-start-ms="${leadSwimmer.waveStartMs}" class="font-mono font-extrabold text-4xl sm:text-5xl tracking-tight tabular-nums leading-none mt-1">
                                        ${formatNetSwimMs(initialNetMs)}
                                    </div>
                                </div>

                                <div class="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider pt-1.5 border-t border-white/20">
                                    <span>Dep: ${formatClockMs(leadSwimmer.waveStartMs, 1)}</span>
                                    <span class="px-2 py-0.5 rounded bg-white text-blue-700 font-extrabold">TAP TO STOP</span>
                                </div>
                            </div>
                    `;

                    // Secondary Waves also swimming in this lane behind the leader
                    if (followingSwimmers.length > 0) {
                        bodyHtml += `
                            <div class="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                                <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1">Following Waves in Lane (${followingSwimmers.length})</div>
                                ${followingSwimmers.map(sw => {
                                    const swNet = Math.max(0, currentMasterMs - sw.waveStartMs);
                                    return `
                                        <div onclick="stopSwimmerByUid('${sw.uid}')"
                                            class="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-cyan-500/20 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 cursor-pointer active:scale-95 transition">
                                            <div class="min-w-0">
                                                <div class="flex items-center gap-1.5">
                                                    <span class="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono font-extrabold text-[11px]">W#${sw.waveNum}</span>
                                                    <span class="font-bold text-xs truncate">${escapeHtml(sw.swimmerName)}</span>
                                                </div>
                                            </div>
                                            <div class="flex items-center gap-2 shrink-0">
                                                <span data-swimmer-start-ms="${sw.waveStartMs}" class="font-mono font-extrabold text-sm tabular-nums text-slate-800 dark:text-slate-200">
                                                    ${formatNetSwimMs(swNet)}
                                                </span>
                                                <span class="px-2 py-1 rounded-lg bg-cyan-600 text-white font-extrabold text-[11px]">STOP</span>
                                                <button type="button" onclick="scratchSwimmerByUid('${sw.uid}', event)" class="text-slate-400 hover:text-rose-500 px-1 text-xs font-bold">✕</button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `;
                    }
                    bodyHtml += `</div>`;
                } else {
                    // Empty Lane State (Waiting for next wave to depart)
                    bodyHtml += `
                        <div class="p-5 flex-1 flex flex-col items-center justify-center text-center min-h-[150px] border-dashed border-slate-200 dark:border-slate-800">
                            <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            </div>
                            <p class="text-xs font-bold text-slate-500 dark:text-slate-400">No Active Swimmers in Water</p>
                            <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Launch next wave or tap "+1 Swim"</p>
                        </div>
                    `;
                }

                // Footer showing Last Recorded Split for this Lane
                let footerHtml = '';
                if (lastSplit) {
                    let paceBadge = '';
                    if (lastSplit.targetTimeSec > 0) {
                        const diff = (lastSplit.netTimeMs / 1000) - lastSplit.targetTimeSec;
                        const sign = diff > 0 ? '+' : '';
                        const colorCls = diff <= 0
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
                        paceBadge = `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${colorCls}">${sign}${diff.toFixed(2)}s</span>`;
                    }
                    footerHtml = `
                        <div class="px-3.5 py-2 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                            <span class="text-slate-500 dark:text-slate-400 truncate">Last: <strong class="text-slate-700 dark:text-slate-200">W${lastSplit.waveNum} ${escapeHtml(lastSplit.swimmerName)}</strong></span>
                            <div class="flex items-center gap-1.5 shrink-0">
                                ${paceBadge}
                                <span class="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">${formatNetSwimMs(lastSplit.netTimeMs)}</span>
                            </div>
                        </div>
                    `;
                } else {
                    footerHtml = `
                        <div class="px-3.5 py-2 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                            <span>Last Split</span>
                            <span class="font-mono">--.--</span>
                        </div>
                    `;
                }

                card.innerHTML = headerHtml + bodyHtml + footerHtml;
                grid.appendChild(card);
            }
        }

        /********************************************************************
         * RESULTS TABLE, STATS & CSV EXPORT
         ********************************************************************/
        function populateResultsFilterDropdowns() {
            const laneSel = document.getElementById('filterLaneSelect');
            const waveSel = document.getElementById('filterWaveSelect');
            const currentLaneVal = laneSel.value;
            const currentWaveVal = waveSel.value;

            // Unique lanes
            const lanesMap = new Map();
            state.results.forEach(r => lanesMap.set(r.laneId, r.laneName));
            laneSel.innerHTML = `<option value="all">All Lanes</option>`;
            Array.from(lanesMap.entries()).sort((a, b) => a[0] - b[0]).forEach(([id, name]) => {
                laneSel.innerHTML += `<option value="${id}">${escapeHtml(name)}</option>`;
            });
            if ([...lanesMap.keys()].map(String).includes(currentLaneVal)) laneSel.value = currentLaneVal;

            // Unique waves
            const wavesSet = new Set(state.results.map(r => r.waveNum));
            waveSel.innerHTML = `<option value="all">All Waves</option>`;
            Array.from(wavesSet).sort((a, b) => a - b).forEach(w => {
                waveSel.innerHTML += `<option value="${w}">Wave #${w}</option>`;
            });
            if ([...wavesSet].map(String).includes(currentWaveVal)) waveSel.value = currentWaveVal;
        }

        function renderResultsView() {
            const laneFilter = document.getElementById('filterLaneSelect').value;
            const waveFilter = document.getElementById('filterWaveSelect').value;
            const sortBy = document.getElementById('sortResultsSelect').value;

            let filtered = state.results.slice();
            if (laneFilter !== 'all') {
                filtered = filtered.filter(r => String(r.laneId) === laneFilter);
            }
            if (waveFilter !== 'all') {
                filtered = filtered.filter(r => String(r.waveNum) === waveFilter);
            }

            if (sortBy === 'wave') {
                filtered.sort((a, b) => a.waveNum - b.waveNum || a.laneId - b.laneId);
            } else if (sortBy === 'lane') {
                filtered.sort((a, b) => a.laneId - b.laneId || a.waveNum - b.waveNum);
            } else if (sortBy === 'fastest') {
                filtered.sort((a, b) => a.netTimeMs - b.netTimeMs);
            }

            // Update KPI Cards
            document.getElementById('statTotalSwims').textContent = filtered.length;
            const uniqueWavesCount = new Set(state.results.map(r => r.waveNum)).size;
            document.getElementById('statTotalWaves').textContent = Math.max(state.runtime.wavesLaunched, uniqueWavesCount);

            if (filtered.length > 0) {
                const netTimes = filtered.map(r => r.netTimeMs);
                const fastestMs = Math.min(...netTimes);
                const avgMs = netTimes.reduce((a, b) => a + b, 0) / netTimes.length;
                document.getElementById('statFastestSwim').textContent = formatNetSwimMs(fastestMs);
                document.getElementById('statAverageSwim').textContent = formatNetSwimMs(avgMs);
            } else {
                document.getElementById('statFastestSwim').textContent = '--';
                document.getElementById('statAverageSwim').textContent = '--';
            }

            const tbody = document.getElementById('resultsTableBody');
            if (filtered.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="py-10 text-center text-slate-400">
                            No recorded swim splits match the current filter. Stop swimmers on the Pool Deck tab to log splits.
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = filtered.map(r => {
                let diffHtml = `<span class="text-slate-400">--</span>`;
                if (r.targetTimeSec > 0) {
                    const diff = (r.netTimeMs / 1000) - r.targetTimeSec;
                    const sign = diff > 0 ? '+' : '';
                    const badgeClass = diff <= 0
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
                    diffHtml = `<span class="px-2 py-0.5 rounded-md font-mono font-bold text-xs ${badgeClass}">${sign}${diff.toFixed(2)}s</span>`;
                }

                return `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="py-3 px-3">
                            <span class="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-mono font-extrabold text-xs">W#${r.waveNum}</span>
                        </td>
                        <td class="py-3 px-3 font-bold">${escapeHtml(r.laneName)}</td>
                        <td class="py-3 px-3 font-semibold">${escapeHtml(r.swimmerName)}</td>
                        <td class="py-3 px-3 font-mono font-extrabold text-base text-emerald-600 dark:text-emerald-400">${formatNetSwimMs(r.netTimeMs)}</td>
                        <td class="py-3 px-3">${diffHtml}</td>
                        <td class="py-3 px-3 font-mono text-xs text-slate-500">${formatClockMs(r.waveStartMs, 1)}</td>
                        <td class="py-3 px-3 font-mono text-xs text-slate-500">${formatClockMs(r.finishMasterMs, 2)}</td>
                        <td class="py-3 px-3 text-right">
                            <button onclick="deleteResultRecord('${r.id}')" class="text-xs font-bold text-rose-500 hover:underline">Delete</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        function deleteResultRecord(id) {
            state.results = state.results.filter(r => r.id !== id);
            saveToStorage();
            renderResultsView();
            updateDeckHeaderUI();
            updateHeaderSummary();
        }

        function exportResultsCSV() {
            if (state.results.length === 0) {
                showToast('No results to export yet');
                return;
            }
            const headers = ['Set Name', 'Pool Course', 'Wave #', 'Lane', 'Swimmer', 'Net Time (s)', 'Net Time Formatted', 'Target Time (s)', 'Wave Start Clock', 'Finish Clock', 'Recorded At'];
            const rows = state.results.map(r => [
                `"${(r.setName || '').replace(/"/g, '""')}"`,
                `"${r.poolCourse || ''}"`,
                r.waveNum,
                `"${(r.laneName || '').replace(/"/g, '""')}"`,
                `"${(r.swimmerName || '').replace(/"/g, '""')}"`,
                (r.netTimeMs / 1000).toFixed(2),
                `"${formatNetSwimMs(r.netTimeMs)}"`,
                r.targetTimeSec || '',
                `"${formatClockMs(r.waveStartMs, 2)}"`,
                `"${formatClockMs(r.finishMasterMs, 2)}"`,
                `"${r.timestampISO || ''}"`
            ]);

            const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const cleanSetName = (state.config.setName || 'swim_set').toLowerCase().replace(/[^a-z0-9]+/g, '_');
            a.href = url;
            a.download = `aquapace_${cleanSetName}_${new Date().toISOString().slice(0,10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('CSV exported successfully');
        }

        function copyResultsToClipboard() {
            if (state.results.length === 0) {
                showToast('No results to copy');
                return;
            }
            const lines = [
                `AquaPace Set Summary: ${state.config.setName} (${state.config.poolCourse})`,
                `----------------------------------------`
            ];
            state.results.slice().reverse().forEach(r => {
                lines.push(`Wave #${r.waveNum} | ${r.laneName} | ${r.swimmerName}: ${formatNetSwimMs(r.netTimeMs)}`);
            });

            const textarea = document.createElement('textarea');
            textarea.value = lines.join('\n');
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showToast('Copied swim times to clipboard');
            } catch (err) {
                showToast('Could not copy to clipboard');
            }
            document.body.removeChild(textarea);
        }

        /********************************************************************
         * MODALS, SOUND, THEME & UTILITIES
         ********************************************************************/
        function openResetModal() {
            const overlay = document.getElementById('customModalOverlay');
            document.getElementById('modalTitle').textContent = 'Reset Pool Deck Stopwatch?';
            document.getElementById('modalDescription').textContent =
                'Choose whether to reset only the active master clock and waves in the water (keeping your recorded splits), or start a brand new set with a clean log.';

            document.getElementById('modalButtons').innerHTML = `
                <button onclick="closeModal()" class="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-xs">Cancel</button>
                <button onclick="confirmResetClockOnly()" class="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs">Reset Clock Only</button>
                <button onclick="confirmResetClockAndResults()" class="px-4 py-2 rounded-xl bg-rose-600 text-white font-extrabold text-xs">Reset Clock & Clear Splits</button>
            `;
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
        }

        function openClearResultsModal() {
            const overlay = document.getElementById('customModalOverlay');
            document.getElementById('modalTitle').textContent = 'Clear All Recorded Splits?';
            document.getElementById('modalDescription').textContent =
                'This will permanently remove all recorded swimmer times from your offline log. Make sure you have exported to CSV if needed.';

            document.getElementById('modalButtons').innerHTML = `
                <button onclick="closeModal()" class="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-xs">Cancel</button>
                <button onclick="confirmClearAllSplits()" class="px-4 py-2 rounded-xl bg-rose-600 text-white font-extrabold text-xs">Yes, Clear Results</button>
            `;
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
        }

        function closeModal() {
            const overlay = document.getElementById('customModalOverlay');
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }

        function confirmResetClockOnly() {
            if (rafId) cancelAnimationFrame(rafId);
            state.runtime.isRunning = false;
            state.runtime.isPaused = false;
            state.runtime.wavesLaunched = 0;
            state.runtime.activeSwimmers = [];
            state.runtime.undoStack = [];
            document.getElementById('masterClockDisplay').textContent = '00:00.0';
            closeModal();
            renderDeckLanes();
            updateDeckHeaderUI();
            updateHeaderSummary();
            showToast('Deck clock reset — recorded splits kept');
        }

        function confirmResetClockAndResults() {
            state.results = [];
            saveToStorage();
            confirmResetClockOnly();
            showToast('Started fresh set — clock & splits cleared');
        }

        function confirmClearAllSplits() {
            state.results = [];
            saveToStorage();
            closeModal();
            renderResultsView();
            updateDeckHeaderUI();
            updateHeaderSummary();
            showToast('Cleared recorded results log');
        }

        function toggleSound() {
            state.soundEnabled = !state.soundEnabled;
            updateSoundUI();
            saveToStorage();
            if (state.soundEnabled) {
                playCountdownPip();
                showToast('Poolside Audio Beeps ON');
            } else {
                showToast('Audio Muted');
            }
        }

        function updateSoundUI() {
            const onIcon = document.getElementById('soundOnIcon');
            const offIcon = document.getElementById('soundOffIcon');
            if (state.soundEnabled) {
                onIcon.classList.remove('hidden');
                offIcon.classList.add('hidden');
            } else {
                onIcon.classList.add('hidden');
                offIcon.classList.remove('hidden');
            }
        }

        function toggleTheme() {
            const html = document.documentElement;
            html.classList.toggle('dark');
        }

        function showToast(message) {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = 'px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs shadow-lg border border-slate-700 dark:border-slate-200 transition-all duration-300';
            toast.textContent = message;
            container.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 2200);
        }

        function escapeHtml(str) {
            return String(str || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

/********************************************************************
         * SWIMMERS & SQUADS DATABASE, IMPORT/EXPORT & ROSTER MANAGEMENT
         ********************************************************************/
        function selectSwimmersGroup(groupId) {
            swimmersUI.activeGroupId = groupId;
            renderSwimmersView();
        }

        function handleSwimmerSearch(query) {
            swimmersUI.searchQuery = (query || '').trim().toLowerCase();
            renderSwimmersView();
        }

        function handleSwimmerStrokeFilter(stroke) {
            swimmersUI.strokeFilter = stroke;
            renderSwimmersView();
        }

        function handleSwimmerSortOrder(order) {
            swimmersUI.sortOrder = order;
            renderSwimmersView();
        }

        function renderSwimmersView() {
            if (!state.club) state.club = getDefaultClubData();
            if (!Array.isArray(state.club.groups)) state.club.groups = [];
            if (!Array.isArray(state.club.swimmers)) state.club.swimmers = [];

            // Summary Pill in header
            const clubPill = document.getElementById('clubTotalSwimmersPill');
            if (clubPill) {
                clubPill.textContent = `${state.club.swimmers.length} Swimmers in ${state.club.groups.length} Squads`;
            }

            // Left Sidebar: Groups List
            const groupsList = document.getElementById('swimmerGroupsList');
            if (groupsList) {
                groupsList.innerHTML = '';

                // "All Club Swimmers" card
                const allSelected = swimmersUI.activeGroupId === 'all';
                const allCard = document.createElement('div');
                allCard.onclick = () => selectSwimmersGroup('all');
                allCard.className = `p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    allSelected
                        ? 'bg-cyan-500/15 border-cyan-500/50 shadow-sm text-cyan-900 dark:text-cyan-200'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`;
                allCard.innerHTML = `
                    <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                        </div>
                        <div>
                            <h4 class="font-bold text-xs">All Club Swimmers</h4>
                            <p class="text-[10px] text-slate-400">Complete Club Roster</p>
                        </div>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">${state.club.swimmers.length}</span>
                `;
                groupsList.appendChild(allCard);

                // Specific squads
                state.club.groups.forEach(grp => {
                    const isSelected = swimmersUI.activeGroupId === grp.id;
                    const colorCls = getGroupColorClasses(grp.color);
                    const count = state.club.swimmers.filter(s => s.groupId === grp.id).length;

                    const card = document.createElement('div');
                    card.className = `p-3 rounded-xl border transition group flex flex-col justify-between space-y-2 ${
                        isSelected
                            ? 'bg-cyan-500/15 border-cyan-500/50 shadow-sm text-cyan-900 dark:text-cyan-200'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`;

                    card.innerHTML = `
                        <div class="flex items-center justify-between cursor-pointer" onclick="selectSwimmersGroup('${grp.id}')">
                            <div class="flex items-center gap-2">
                                <span class="w-3 h-3 rounded-full ${colorCls.dot}"></span>
                                <div>
                                    <h4 class="font-bold text-xs truncate max-w-[150px]">${escapeHtml(grp.name)}</h4>
                                    ${grp.description ? `<p class="text-[10px] text-slate-400 truncate max-w-[160px]">${escapeHtml(grp.description)}</p>` : ''}
                                </div>
                            </div>
                            <span class="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">${count}</span>
                        </div>

                        <!-- Squad Actions Toolbar -->
                        <div class="flex items-center justify-end gap-1 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px]">
                            <button onclick="event.stopPropagation(); openExportModal('${grp.id}')" title="Export this squad (CSV/JSON)" class="px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-cyan-600 transition flex items-center gap-1">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                <span>Export</span>
                            </button>
                            <button onclick="event.stopPropagation(); openImportModal('${grp.id}')" title="Import swimmers into this squad" class="px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-cyan-600 transition flex items-center gap-1">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                                <span>Import</span>
                            </button>
                            <button onclick="event.stopPropagation(); openEditGroupModal('${grp.id}')" title="Edit squad name & details" class="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                            </button>
                            <button onclick="event.stopPropagation(); confirmDeleteGroup('${grp.id}')" title="Delete squad" class="px-1.5 py-0.5 rounded hover:bg-rose-500/15 text-slate-400 hover:text-rose-500 transition">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                        </div>
                    `;
                    groupsList.appendChild(card);
                });
            }

            // Right Pane: Active Squad Header
            const nameHeader = document.getElementById('selectedGroupNameHeader');
            const descHeader = document.getElementById('selectedGroupDescHeader');
            const countBadge = document.getElementById('selectedGroupCountBadge');
            const actionContainer = document.getElementById('selectedGroupActionButtons');

            let activeGroup = null;
            if (swimmersUI.activeGroupId !== 'all') {
                activeGroup = state.club.groups.find(g => g.id === swimmersUI.activeGroupId);
            }

            if (activeGroup) {
                const groupCount = state.club.swimmers.filter(s => s.groupId === activeGroup.id).length;
                if (nameHeader) nameHeader.textContent = activeGroup.name;
                if (descHeader) descHeader.textContent = activeGroup.description || 'Swimmers registered in this training squad.';
                if (countBadge) countBadge.textContent = `${groupCount} Swimmer${groupCount === 1 ? '' : 's'}`;
                if (actionContainer) {
                    actionContainer.innerHTML = `
                        <button onclick="openExportModal('${activeGroup.id}')" class="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            <span>Export Squad</span>
                        </button>
                        <button onclick="openImportModal('${activeGroup.id}')" class="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                            <span>Import</span>
                        </button>
                        <button onclick="openAddSwimmerModal('${activeGroup.id}')" class="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shadow-sm transition flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                            <span>+ Swimmer</span>
                        </button>
                    `;
                }
            } else {
                if (nameHeader) nameHeader.textContent = 'All Club Swimmers';
                if (descHeader) descHeader.textContent = 'Showing all registered swimmers across all club squads.';
                if (countBadge) countBadge.textContent = `${state.club.swimmers.length} Swimmers`;
                if (actionContainer) {
                    actionContainer.innerHTML = `
                        <button onclick="openExportModal('club')" class="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            <span>Export Club</span>
                        </button>
                        <button onclick="openImportModal('club')" class="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                            <span>Import Club</span>
                        </button>
                        <button onclick="openAddSwimmerModal()" class="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shadow-sm transition flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                            <span>+ Swimmer</span>
                        </button>
                    `;
                }
            }

            // Filter & Sort swimmers
            let list = [...state.club.swimmers];
            if (swimmersUI.activeGroupId !== 'all') {
                list = list.filter(s => s.groupId === swimmersUI.activeGroupId);
            }
            if (swimmersUI.strokeFilter !== 'all') {
                list = list.filter(s => s.stroke === swimmersUI.strokeFilter);
            }
            if (swimmersUI.searchQuery) {
                const q = swimmersUI.searchQuery;
                list = list.filter(s =>
                    (s.name && s.name.toLowerCase().includes(q)) ||
                    (s.notes && s.notes.toLowerCase().includes(q)) ||
                    (s.stroke && s.stroke.toLowerCase().includes(q))
                );
            }

            // Sorting
            if (swimmersUI.sortOrder === 'name') {
                list.sort((a, b) => a.name.localeCompare(b.name));
            } else if (swimmersUI.sortOrder === 'age') {
                list.sort((a, b) => {
                    const yobA = parseInt(a.yob, 10) || 0;
                    const yobB = parseInt(b.yob, 10) || 0;
                    return yobB - yobA; // youngest (highest YOB) first
                });
            } else if (swimmersUI.sortOrder === 'stroke') {
                list.sort((a, b) => (a.stroke || '').localeCompare(b.stroke || ''));
            }

            // Render Swimmers Table
            const tbody = document.getElementById('swimmersTableBody');
            if (tbody) {
                tbody.innerHTML = '';
                if (list.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="6" class="py-8 text-center text-slate-400">
                                <div class="flex flex-col items-center justify-center space-y-2">
                                    <svg class="w-8 h-8 opacity-40" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                                    <p class="font-bold text-xs">No swimmers found in this view.</p>
                                    <button onclick="openAddSwimmerModal('${swimmersUI.activeGroupId !== 'all' ? swimmersUI.activeGroupId : ''}')" class="text-xs text-cyan-600 dark:text-cyan-400 font-bold hover:underline">+ Add a swimmer now</button>
                                </div>
                            </td>
                        </tr>
                    `;
                    return;
                }

                const currentYear = new Date().getFullYear();

                list.forEach(swimmer => {
                    const grp = state.club.groups.find(g => g.id === swimmer.groupId);
                    const colorCls = getGroupColorClasses(grp ? grp.color : 'cyan');

                    // Calculate age if valid YOB
                    let ageText = '--';
                    const yobNum = parseInt(swimmer.yob, 10);
                    if (yobNum > 1920 && yobNum <= currentYear) {
                        ageText = `${currentYear - yobNum} yrs • ${yobNum}`;
                    } else if (swimmer.yob) {
                        ageText = swimmer.yob;
                    }

                    // Initials
                    const initials = (swimmer.name || '')
                        .split(' ')
                        .map(p => p[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'SW';

                    const row = document.createElement('tr');
                    row.className = 'hover:bg-slate-50 dark:hover:bg-slate-800/50 transition';
                    row.innerHTML = `
                        <td class="py-3 px-3.5">
                            <div class="flex items-center gap-2.5">
                                <div class="w-7 h-7 rounded-full ${colorCls.bg} ${colorCls.text} border ${colorCls.border} flex items-center justify-center font-bold text-[11px] shrink-0">
                                    ${initials}
                                </div>
                                <div>
                                    <span class="font-bold text-slate-900 dark:text-slate-100">${escapeHtml(swimmer.name)}</span>
                                    ${swimmer.gender ? `<span class="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">${swimmer.gender}</span>` : ''}
                                </div>
                            </div>
                        </td>
                        <td class="py-3 px-3">
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${colorCls.bg} ${colorCls.text} border ${colorCls.border}">
                                ${escapeHtml(grp ? grp.name : 'Unassigned')}
                            </span>
                        </td>
                        <td class="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 text-xs">
                            ${ageText}
                        </td>
                        <td class="py-3 px-3">
                            <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                                ${escapeHtml(swimmer.stroke || 'Freestyle')}
                            </span>
                        </td>
                        <td class="py-3 px-3 text-slate-500 dark:text-slate-400 truncate max-w-xs text-xs" title="${escapeHtml(swimmer.notes || '')}">
                            ${swimmer.notes ? escapeHtml(swimmer.notes) : '<span class="italic text-slate-400">None</span>'}
                        </td>
                        <td class="py-3 px-3 text-right">
                            <div class="flex items-center justify-end gap-1.5">
                                <button onclick="openEditSwimmerModal('${swimmer.id}')" title="Edit swimmer" class="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                </button>
                                <button onclick="confirmDeleteSwimmer('${swimmer.id}')" title="Delete swimmer" class="p-1 rounded-lg hover:bg-rose-500/15 text-slate-400 hover:text-rose-500 transition">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                </button>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            }
        }

        /********************************************************************
         * SWIMMER & SQUAD MODALS (ADD, EDIT, BULK ADD)
         ********************************************************************/
        function populateGroupSelectOptions(selectElId, selectedId) {
            const el = document.getElementById(selectElId);
            if (!el) return;
            el.innerHTML = '';
            (state.club.groups || []).forEach(grp => {
                const opt = document.createElement('option');
                opt.value = grp.id;
                opt.textContent = grp.name;
                if (grp.id === selectedId) opt.selected = true;
                el.appendChild(opt);
            });
        }

        function openAddSwimmerModal(defaultGroupId) {
            document.getElementById('swimmerModalTitle').textContent = 'Add New Swimmer';
            document.getElementById('swimmerFormId').value = '';
            document.getElementById('swimmerFormName').value = '';
            document.getElementById('swimmerFormYOB').value = '';
            document.getElementById('swimmerFormGender').value = '';
            document.getElementById('swimmerFormStroke').value = 'Freestyle';
            document.getElementById('swimmerFormNotes').value = '';

            const activeGrp = defaultGroupId || (swimmersUI.activeGroupId !== 'all' ? swimmersUI.activeGroupId : (state.club.groups[0] ? state.club.groups[0].id : ''));
            populateGroupSelectOptions('swimmerFormGroup', activeGrp);

            const overlay = document.getElementById('swimmerModalOverlay');
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
            setTimeout(() => document.getElementById('swimmerFormName').focus(), 50);
        }

        function openEditSwimmerModal(swimmerId) {
            const swimmer = (state.club.swimmers || []).find(s => s.id === swimmerId);
            if (!swimmer) return;

            document.getElementById('swimmerModalTitle').textContent = 'Edit Swimmer Details';
            document.getElementById('swimmerFormId').value = swimmer.id;
            document.getElementById('swimmerFormName').value = swimmer.name || '';
            document.getElementById('swimmerFormYOB').value = swimmer.yob || '';
            document.getElementById('swimmerFormGender').value = swimmer.gender || '';
            document.getElementById('swimmerFormStroke').value = swimmer.stroke || 'Freestyle';
            document.getElementById('swimmerFormNotes').value = swimmer.notes || '';

            populateGroupSelectOptions('swimmerFormGroup', swimmer.groupId);

            const overlay = document.getElementById('swimmerModalOverlay');
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
            setTimeout(() => document.getElementById('swimmerFormName').focus(), 50);
        }

        function closeSwimmerModal() {
            const overlay = document.getElementById('swimmerModalOverlay');
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }

        function handleSwimmerFormSubmit(event) {
            event.preventDefault();
            const id = document.getElementById('swimmerFormId').value;
            const name = document.getElementById('swimmerFormName').value.trim();
            const groupId = document.getElementById('swimmerFormGroup').value;
            const stroke = document.getElementById('swimmerFormStroke').value;
            const yobVal = document.getElementById('swimmerFormYOB').value;
            const gender = document.getElementById('swimmerFormGender').value;
            const notes = document.getElementById('swimmerFormNotes').value.trim();

            if (!name) {
                showToast('Swimmer name is required');
                return;
            }

            if (id) {
                // Update
                const swimmer = state.club.swimmers.find(s => s.id === id);
                if (swimmer) {
                    swimmer.name = name;
                    swimmer.groupId = groupId;
                    swimmer.stroke = stroke;
                    swimmer.yob = yobVal ? parseInt(yobVal, 10) : '';
                    swimmer.gender = gender;
                    swimmer.notes = notes;
                    showToast(`Updated details for ${name}`);
                }
            } else {
                // Create
                const newSwimmer = {
                    id: `sw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    groupId: groupId,
                    name: name,
                    stroke: stroke,
                    yob: yobVal ? parseInt(yobVal, 10) : '',
                    gender: gender,
                    notes: notes
                };
                state.club.swimmers.push(newSwimmer);
                showToast(`Added ${name} to ${getGroupName(groupId)}`);
            }

            saveToStorage();
            closeSwimmerModal();
            renderSwimmersView();
            updateHeaderSummary();
        }

        function confirmDeleteSwimmer(swimmerId) {
            const swimmer = state.club.swimmers.find(s => s.id === swimmerId);
            if (!swimmer) return;
            state.club.swimmers = state.club.swimmers.filter(s => s.id !== swimmerId);
            saveToStorage();
            renderSwimmersView();
            updateHeaderSummary();
            showToast(`Removed ${swimmer.name} from club`);
        }

        // Squad Modals
        function openAddGroupModal() {
            document.getElementById('groupModalTitle').textContent = 'Add New Swimming Squad';
            document.getElementById('groupFormId').value = '';
            document.getElementById('groupFormName').value = '';
            document.getElementById('groupFormDesc').value = '';
            document.getElementById('groupFormColor').value = 'cyan';

            const overlay = document.getElementById('groupModalOverlay');
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
            setTimeout(() => document.getElementById('groupFormName').focus(), 50);
        }

        function openEditGroupModal(groupId) {
            const grp = state.club.groups.find(g => g.id === groupId);
            if (!grp) return;

            document.getElementById('groupModalTitle').textContent = 'Edit Squad Details';
            document.getElementById('groupFormId').value = grp.id;
            document.getElementById('groupFormName').value = grp.name || '';
            document.getElementById('groupFormDesc').value = grp.description || '';
            document.getElementById('groupFormColor').value = grp.color || 'cyan';

            const overlay = document.getElementById('groupModalOverlay');
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
            setTimeout(() => document.getElementById('groupFormName').focus(), 50);
        }

        function closeGroupModal() {
            const overlay = document.getElementById('groupModalOverlay');
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }

        function handleGroupFormSubmit(event) {
            event.preventDefault();
            const id = document.getElementById('groupFormId').value;
            const name = document.getElementById('groupFormName').value.trim();
            const desc = document.getElementById('groupFormDesc').value.trim();
            const color = document.getElementById('groupFormColor').value;

            if (!name) {
                showToast('Squad name is required');
                return;
            }

            if (id) {
                const grp = state.club.groups.find(g => g.id === id);
                if (grp) {
                    grp.name = name;
                    grp.description = desc;
                    grp.color = color;
                    showToast(`Updated squad ${name}`);
                }
            } else {
                const newId = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                state.club.groups.push({
                    id: newId,
                    name: name,
                    description: desc,
                    color: color
                });
                // Automatically add to session groups
                if (Array.isArray(state.config.selectedGroupIds)) {
                    state.config.selectedGroupIds.push(newId);
                }
                swimmersUI.activeGroupId = newId;
                showToast(`Created new squad: ${name}`);
            }

            saveToStorage();
            closeGroupModal();
            renderSwimmersView();
        }

        function confirmDeleteGroup(groupId) {
            const grp = state.club.groups.find(g => g.id === groupId);
            if (!grp) return;
            const swimmerCount = state.club.swimmers.filter(s => s.groupId === groupId).length;

            if (state.club.groups.length <= 1) {
                showToast('You must have at least one swimming group');
                return;
            }

            const fallbackGroup = state.club.groups.find(g => g.id !== groupId);

            // Reassign swimmers to fallback group
            state.club.swimmers.forEach(s => {
                if (s.groupId === groupId) {
                    s.groupId = fallbackGroup.id;
                }
            });

            // Remove group
            state.club.groups = state.club.groups.filter(g => g.id !== groupId);
            state.config.selectedGroupIds = (state.config.selectedGroupIds || []).filter(id => id !== groupId);
            if (swimmersUI.activeGroupId === groupId) {
                swimmersUI.activeGroupId = 'all';
            }

            saveToStorage();
            renderSwimmersView();
            showToast(`Deleted squad "${grp.name}". ${swimmerCount} swimmer(s) reassigned to ${fallbackGroup.name}`);
        }

        // Bulk Add Modal
        function openBulkAddSwimmerModal(defaultGroupId) {
            const activeGrp = defaultGroupId || (swimmersUI.activeGroupId !== 'all' ? swimmersUI.activeGroupId : (state.club.groups[0] ? state.club.groups[0].id : ''));
            populateGroupSelectOptions('bulkAddGroupSelect', activeGrp);
            document.getElementById('bulkAddNamesInput').value = '';

            const overlay = document.getElementById('bulkSwimmerModalOverlay');
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
            setTimeout(() => document.getElementById('bulkAddNamesInput').focus(), 50);
        }

        function closeBulkAddModal() {
            const overlay = document.getElementById('bulkSwimmerModalOverlay');
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }

        function confirmBulkAddSwimmers() {
            const groupId = document.getElementById('bulkAddGroupSelect').value;
            const text = document.getElementById('bulkAddNamesInput').value.trim();

            if (!text) {
                showToast('Please enter at least one swimmer name');
                return;
            }

            // Split by newlines or commas
            const lines = text.split(/\r?\n|,/);
            let addedCount = 0;

            lines.forEach(line => {
                const clean = line.trim();
                if (clean.length > 0) {
                    state.club.swimmers.push({
                        id: `sw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                        groupId: groupId,
                        name: clean,
                        stroke: 'Freestyle',
                        yob: '',
                        gender: '',
                        notes: ''
                    });
                    addedCount++;
                }
            });

            saveToStorage();
            closeBulkAddModal();
            renderSwimmersView();
            updateHeaderSummary();
            showToast(`Added ${addedCount} swimmers to ${getGroupName(groupId)}`);
        }

        /********************************************************************
         * GROUP & CLUB LEVEL IMPORT & EXPORT (JSON & CSV)
         ********************************************************************/
        function downloadFile(content, fileName, mimeType) {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        function generateCSV(headers, rows) {
            const escape = val => {
                if (val === null || val === undefined) return '""';
                const str = String(val).replace(/"/g, '""');
                return `"${str}"`;
            };
            const headerRow = headers.map(escape).join(',');
            const bodyRows = rows.map(row => row.map(escape).join(','));
            return [headerRow, ...bodyRows].join('\r\n');
        }

        function parseCSV(text) {
            const lines = [];
            let row = [];
            let inQuotes = false;
            let token = '';

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const nextChar = text[i + 1];

                if (char === '"') {
                    if (inQuotes && nextChar === '"') {
                        token += '"';
                        i++; // skip escaped quote
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    row.push(token.trim());
                    token = '';
                } else if ((char === '\r' || char === '\n') && !inQuotes) {
                    if (char === '\r' && nextChar === '\n') i++;
                    row.push(token.trim());
                    if (row.length > 0 && row.some(cell => cell.length > 0)) {
                        lines.push(row);
                    }
                    row = [];
                    token = '';
                } else {
                    token += char;
                }
            }
            if (token.length > 0 || row.length > 0) {
                row.push(token.trim());
                if (row.some(cell => cell.length > 0)) {
                    lines.push(row);
                }
            }
            return lines;
        }

        // Export Modal & Execution
        function openExportModal(defaultScope = 'club') {
            const select = document.getElementById('exportScopeSelect');
            select.innerHTML = '<option value="club">Entire Club (All Squads & Swimmers)</option>';
            (state.club.groups || []).forEach(grp => {
                const opt = document.createElement('option');
                opt.value = grp.id;
                opt.textContent = `Squad: ${grp.name}`;
                if (grp.id === defaultScope) opt.selected = true;
                select.appendChild(opt);
            });

            if (defaultScope === 'club') {
                select.value = 'club';
            }

            const overlay = document.getElementById('exportRosterModalOverlay');
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
        }

        function closeExportModal() {
            const overlay = document.getElementById('exportRosterModalOverlay');
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }

        function confirmExportRoster() {
            const scope = document.getElementById('exportScopeSelect').value;
            const formatRadios = document.getElementsByName('exportFormat');
            let format = 'json';
            for (let r of formatRadios) {
                if (r.checked) { format = r.value; break; }
            }

            if (scope === 'club') {
                if (format === 'json') {
                    exportClubJSON();
                } else {
                    exportClubCSV();
                }
            } else {
                if (format === 'json') {
                    exportGroupJSON(scope);
                } else {
                    exportGroupCSV(scope);
                }
            }
            closeExportModal();
        }

        function exportClubJSON() {
            const data = {
                app: 'AquaPace',
                version: '1.0',
                exportType: 'club',
                exportedAt: new Date().toISOString(),
                clubName: state.club.name || 'AquaPace Swim Club',
                groups: state.club.groups,
                swimmers: state.club.swimmers
            };
            const jsonStr = JSON.stringify(data, null, 2);
            const dateStr = new Date().toISOString().slice(0, 10);
            downloadFile(jsonStr, `aquapace_club_roster_${dateStr}.json`, 'application/json');
            showToast('Club roster JSON exported');
        }

        function exportClubCSV() {
            const headers = ['Group', 'Name', 'Gender', 'YearOfBirth', 'PrimaryStroke', 'Notes'];
            const rows = state.club.swimmers.map(s => [
                getGroupName(s.groupId),
                s.name || '',
                s.gender || '',
                s.yob || '',
                s.stroke || 'Freestyle',
                s.notes || ''
            ]);
            const csv = generateCSV(headers, rows);
            const dateStr = new Date().toISOString().slice(0, 10);
            downloadFile(csv, `aquapace_club_roster_${dateStr}.csv`, 'text/csv;charset=utf-8;');
            showToast('Club roster CSV exported');
        }

        function exportGroupJSON(groupId) {
            const grp = state.club.groups.find(g => g.id === groupId);
            if (!grp) return;
            const swimmers = state.club.swimmers.filter(s => s.groupId === groupId);
            const data = {
                app: 'AquaPace',
                version: '1.0',
                exportType: 'group',
                exportedAt: new Date().toISOString(),
                group: grp,
                swimmers: swimmers
            };
            const jsonStr = JSON.stringify(data, null, 2);
            const cleanName = grp.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
            downloadFile(jsonStr, `aquapace_${cleanName}_squad.json`, 'application/json');
            showToast(`Exported squad: ${grp.name} (JSON)`);
        }

        function exportGroupCSV(groupId) {
            const grp = state.club.groups.find(g => g.id === groupId);
            if (!grp) return;
            const swimmers = state.club.swimmers.filter(s => s.groupId === groupId);
            const headers = ['Name', 'Gender', 'YearOfBirth', 'PrimaryStroke', 'Notes'];
            const rows = swimmers.map(s => [
                s.name || '',
                s.gender || '',
                s.yob || '',
                s.stroke || 'Freestyle',
                s.notes || ''
            ]);
            const csv = generateCSV(headers, rows);
            const cleanName = grp.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
            downloadFile(csv, `aquapace_${cleanName}_squad.csv`, 'text/csv;charset=utf-8;');
            showToast(`Exported squad: ${grp.name} (CSV)`);
        }

        // Import Modal & Execution
        function openImportModal(targetScope = 'club') {
            swimmersUI.pendingImport = null;
            document.getElementById('importPreviewBox').classList.add('hidden');
            document.getElementById('confirmImportBtn').disabled = true;

            const targetSquadContainer = document.getElementById('importTargetSquadContainer');
            const targetSquadSelect = document.getElementById('importTargetSquadSelect');

            populateGroupSelectOptions('importTargetSquadSelect', targetScope !== 'club' ? targetScope : (state.club.groups[0] ? state.club.groups[0].id : ''));

            if (targetScope !== 'club') {
                targetSquadContainer.classList.remove('hidden');
                document.getElementById('importModalTitle').textContent = `Import Swimmers into ${getGroupName(targetScope)}`;
            } else {
                targetSquadContainer.classList.add('hidden');
                document.getElementById('importModalTitle').textContent = 'Import Club Roster';
            }

            const overlay = document.getElementById('importRosterModalOverlay');
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
        }

        function closeImportModal() {
            const overlay = document.getElementById('importRosterModalOverlay');
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
            swimmersUI.pendingImport = null;
        }

        function triggerRosterFileInput() {
            const fileInput = document.getElementById('rosterFileInput');
            fileInput.value = '';
            fileInput.click();
        }

        function handleRosterFileSelected(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const text = e.target.result;
                processImportedText(text, file.name);
            };
            reader.readAsText(file);
        }

        function processImportedText(text, fileName) {
            text = text.trim();
            if (!text) {
                showToast('Selected file is empty');
                return;
            }

            try {
                if (text.startsWith('{') || text.startsWith('[')) {
                    // Process JSON
                    const parsed = JSON.parse(text);
                    if (parsed.exportType === 'group' && parsed.group && Array.isArray(parsed.swimmers)) {
                        swimmersUI.pendingImport = {
                            type: 'group_json',
                            fileName: fileName,
                            group: parsed.group,
                            swimmers: parsed.swimmers
                        };
                        displayImportPreview(fileName, `1 Squad ("${parsed.group.name}"), ${parsed.swimmers.length} Swimmers`, 'AquaPace Squad JSON file');
                    } else if (Array.isArray(parsed.groups) || Array.isArray(parsed.swimmers)) {
                        swimmersUI.pendingImport = {
                            type: 'club_json',
                            fileName: fileName,
                            groups: parsed.groups || [],
                            swimmers: parsed.swimmers || []
                        };
                        displayImportPreview(fileName, `${parsed.groups ? parsed.groups.length : 0} Squads, ${parsed.swimmers ? parsed.swimmers.length : 0} Swimmers`, 'AquaPace Club Roster JSON file');
                    } else if (Array.isArray(parsed)) {
                        // Array of swimmer objects
                        swimmersUI.pendingImport = {
                            type: 'swimmers_array',
                            fileName: fileName,
                            swimmers: parsed
                        };
                        displayImportPreview(fileName, `${parsed.length} Swimmers`, 'JSON Swimmers Array');
                        document.getElementById('importTargetSquadContainer').classList.remove('hidden');
                    } else {
                        showToast('Unrecognized JSON format');
                    }
                } else {
                    // Process CSV
                    const rows = parseCSV(text);
                    if (rows.length < 2) {
                        showToast('CSV must contain a header row and at least one swimmer');
                        return;
                    }

                    const headers = rows[0].map(h => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
                    const groupCol = headers.findIndex(h => h === 'group' || h === 'squad');
                    const nameCol = headers.findIndex(h => h === 'name' || h === 'swimmer' || h === 'swimmername');
                    const genderCol = headers.findIndex(h => h === 'gender' || h === 'sex');
                    const yobCol = headers.findIndex(h => h === 'yearofbirth' || h === 'yob' || h === 'age' || h === 'birthyear');
                    const strokeCol = headers.findIndex(h => h === 'primarystroke' || h === 'stroke');
                    const notesCol = headers.findIndex(h => h === 'notes' || h === 'pb' || h === 'note');

                    const effectiveNameCol = nameCol !== -1 ? nameCol : 0;
                    const parsedSwimmers = [];
                    const foundGroups = new Set();

                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        const name = row[effectiveNameCol];
                        if (!name || !name.trim()) continue;

                        const groupName = groupCol !== -1 && row[groupCol] ? row[groupCol].trim() : '';
                        if (groupName) foundGroups.add(groupName);

                        parsedSwimmers.push({
                            name: name.trim(),
                            groupName: groupName,
                            gender: genderCol !== -1 ? (row[genderCol] || '').trim() : '',
                            yob: yobCol !== -1 ? (row[yobCol] || '').trim() : '',
                            stroke: strokeCol !== -1 ? (row[strokeCol] || 'Freestyle').trim() : 'Freestyle',
                            notes: notesCol !== -1 ? (row[notesCol] || '').trim() : ''
                        });
                    }

                    swimmersUI.pendingImport = {
                        type: 'csv',
                        fileName: fileName,
                        swimmers: parsedSwimmers,
                        hasGroupColumn: groupCol !== -1 && foundGroups.size > 0,
                        groupsFound: Array.from(foundGroups)
                    };

                    const groupSummary = swimmersUI.pendingImport.hasGroupColumn
                        ? `${foundGroups.size} Squads, ${parsedSwimmers.length} Swimmers`
                        : `${parsedSwimmers.length} Swimmers`;

                    displayImportPreview(fileName, groupSummary, `CSV Spreadsheet file with ${parsedSwimmers.length} records`);

                    if (!swimmersUI.pendingImport.hasGroupColumn) {
                        document.getElementById('importTargetSquadContainer').classList.remove('hidden');
                    }
                }
            } catch (err) {
                console.error('Import error:', err);
                showToast('Failed to parse file: ' + err.message);
            }
        }

        function displayImportPreview(fileName, stats, summary) {
            document.getElementById('importFileNameLabel').textContent = fileName;
            document.getElementById('importFileStatsLabel').textContent = stats;
            document.getElementById('importFileSummaryLabel').textContent = summary;
            document.getElementById('importPreviewBox').classList.remove('hidden');
            document.getElementById('confirmImportBtn').disabled = false;
        }

        function confirmImportRoster() {
            if (!swimmersUI.pendingImport) return;

            const importData = swimmersUI.pendingImport;
            const strategyRadios = document.getElementsByName('importMergeStrategy');
            let strategy = 'merge';
            for (let r of strategyRadios) {
                if (r.checked) { strategy = r.value; break; }
            }

            const targetSquadId = document.getElementById('importTargetSquadSelect').value;

            if (strategy === 'replace') {
                state.club = { name: state.club.name || 'AquaPace Swim Club', groups: [], swimmers: [] };
            }

            let importedCount = 0;

            if (importData.type === 'club_json') {
                // Add groups
                importData.groups.forEach(g => {
                    const existing = state.club.groups.find(eg => eg.id === g.id || eg.name.toLowerCase() === g.name.toLowerCase());
                    if (!existing) {
                        state.club.groups.push(g);
                    }
                });
                // Ensure at least one group
                if (state.club.groups.length === 0) {
                    state.club.groups = getDefaultClubData().groups;
                }
                // Add swimmers
                importData.swimmers.forEach(s => {
                    s.id = s.id || `sw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                    // Ensure valid group
                    if (!state.club.groups.some(g => g.id === s.groupId)) {
                        s.groupId = state.club.groups[0].id;
                    }
                    state.club.swimmers.push(s);
                    importedCount++;
                });
            } else if (importData.type === 'group_json') {
                let grp = state.club.groups.find(g => g.id === importData.group.id || g.name.toLowerCase() === importData.group.name.toLowerCase());
                if (!grp) {
                    grp = importData.group;
                    state.club.groups.push(grp);
                }
                importData.swimmers.forEach(s => {
                    s.id = s.id || `sw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                    s.groupId = grp.id;
                    state.club.swimmers.push(s);
                    importedCount++;
                });
            } else if (importData.type === 'csv' || importData.type === 'swimmers_array') {
                const groupNameMap = {};
                // Pre-map existing groups by lower name
                state.club.groups.forEach(g => { groupNameMap[g.name.toLowerCase()] = g.id; });

                importData.swimmers.forEach(s => {
                    let assignedGroupId = targetSquadId;

                    if (s.groupName) {
                        const lowName = s.groupName.toLowerCase();
                        if (groupNameMap[lowName]) {
                            assignedGroupId = groupNameMap[lowName];
                        } else {
                            // Create new group
                            const newGrp = {
                                id: `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                                name: s.groupName,
                                description: 'Imported squad',
                                color: 'blue'
                            };
                            state.club.groups.push(newGrp);
                            groupNameMap[lowName] = newGrp.id;
                            assignedGroupId = newGrp.id;
                        }
                    }

                    if (!assignedGroupId && state.club.groups[0]) {
                        assignedGroupId = state.club.groups[0].id;
                    }

                    state.club.swimmers.push({
                        id: `sw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                        groupId: assignedGroupId,
                        name: s.name,
                        gender: s.gender || '',
                        yob: s.yob ? parseInt(s.yob, 10) || s.yob : '',
                        stroke: s.stroke || 'Freestyle',
                        notes: s.notes || ''
                    });
                    importedCount++;
                });
            }

            // Sync session groups
            if (!Array.isArray(state.config.selectedGroupIds) || state.config.selectedGroupIds.length === 0) {
                state.config.selectedGroupIds = state.club.groups.map(g => g.id);
            }

            saveToStorage();
            closeImportModal();
            renderSwimmersView();
            updateHeaderSummary();
            showToast(`Successfully imported ${importedCount} swimmers`);
        }

        // Initialize App on Load
        window.addEventListener('DOMContentLoaded', () => {
            loadFromStorage();
            updateSoundUI();
            updateHeaderSummary();
            switchView('setup');
        });
