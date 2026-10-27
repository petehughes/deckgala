// tailwind.config.js - DeckGala Design Tokens
module.exports = {
  content: ['./src/**/*.{html,ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        deck: {
          abyss: '#0B1528',
          slate: '#16233B',
          elevated: '#1E3152',
          cyan: '#00E5FF',
          coral: '#FF5A36',
          green: '#00E676',
          amber: '#FFB300',
          frost: '#F4F7FB',
          muted: '#8CA0BA'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Space Mono', 'monospace']
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 229, 255, 0.35)',
        'glow-coral': '0 0 20px rgba(255, 90, 54, 0.4)'
      }
    }
  }
};

