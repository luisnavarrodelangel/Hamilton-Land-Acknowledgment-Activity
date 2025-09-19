// app.js — Vue 2 (options API) prototype
new Vue({
    el: '#app',
    data: {
        // Decision tree
        started: false,
        isHamilton: null,
        awareOfTreaty: null,
        awareInfoShown: false,
        familiarWithSpecifics: null,
        contextShown: false,
        contextDone: false,
        inActivity: false,

        // Items (from your list)
        items: [
            { key: 'clothing_generic', name: 'Clothing (various cloths & pieces)', desc: 'Includes bales of stroud, molton, broad cloth, serge, patterned flannel, trunks of linen, ribbons, hats and related cloth items.' },
            { key: 'barley_beads', name: 'Barley corn beads', desc: 'Beads used to make necklaces, bracelets, and clothing embellishments.' },
            { key: 'gartering', name: 'Barrel of gartering', desc: 'Gartering used for clothing and personal items.' },
            { key: 'guns_boxes', name: 'Boxes of guns', desc: 'Three boxes of guns (firearms).' },
            { key: 'gun_powder', name: 'Gun powder', desc: 'Six half-sized barrels of gun powder.' },
            { key: 'lead_shot', name: 'Lead shot (cases & kegs)', desc: 'Cases of lead shot and kegs of lead balls, used as ammunition.' },
            { key: 'gun_flints', name: 'Gun flints', desc: 'Approximately 1,400 gun flints used for ignition.' },
            { key: 'ag_hoes', name: 'Agricultural hoes and knives', desc: 'Tools that could be used for farming and daily tasks.' },
            { key: 'rum_tobacco', name: 'Rum & tobacco', desc: 'Consumable goods sometimes given as part of exchanges.' },
            { key: 'brass_kettles', name: 'Brass kettles', desc: 'Used for cooking and families\' daily tasks.' },
            { key: 'looking_glasses', name: 'Looking glasses (mirrors)', desc: 'Handheld or small framed mirrors.' },
            { key: 'fish_hooks', name: 'Fish hooks', desc: 'Fishing gear for food procurement.' },
            { key: 'blankets', name: 'Blankets', desc: 'Woven blankets for warmth and trade.' },
            { key: 'ribbons_case', name: 'Ribbons & small items', desc: 'Pieces of ribbon, embellishments, and small trade goods.' }
        ],
        currentIndex: 0,
        workingValue: 0,
        maxValue: 100000, // slider max — large enough for flexibility
        savedValues: {},

        // Comparisons (editable)
        comparisons: {
            house: { label: 'Average house in Hamilton (example)', price: 700000 },
            land: { label: 'Small urban lot (example)', price: 250000 },
            car: { label: 'New small car (example)', price: 28000 }
        },

        reflection: ''
    },
    computed: {
        currentItem() {
            return this.items[this.currentIndex];
        },
        progressPercent() {
            return ((this.currentIndex + 1) / this.items.length) * 100;
        },
        totalSaved() {
            return Object.values(this.savedValues).reduce((s, v) => s + Number(v || 0), 0);
        }
    },
    methods: {
        // Decision tree handlers
        answerInHamilton(val) {
            this.started = true;
            this.isHamilton = val;
            if (val) {
                // ask next about treaty
                this.awareOfTreaty = null;
                this.awareInfoShown = false;
            }
        },
        continueAnyway() {
            // this.awareInfoShown = true;
        },
      
        setAware(val) {
            this.awareOfTreaty = val;
            if (!val) {
                // show info then continue
                this.awareInfoShown = true;
            }
        },
        setFamiliar(val) {
            this.familiarWithSpecifics = val;
            if (val === true) {
                this.contextShown = true;   // show context right away
                this.contextDone = false;
            } else {
                this.contextShown = false;  // wait for them to hit Continue in treaty info
                this.contextDone = false;
            }
        },
        showContext() {
            this.contextShown = true;
        },
        finishContext() {
            this.contextDone = true; // unlock "About the Activity"
        },
        enterActivity() {
            this.inActivity = true;
            this.loadState();
        },

          reset() {
            if (!confirm('Reset this activity? This will clear saved values and answers.')) return;
            this.started = false;
            this.isHamilton = null;
            this.awareOfTreaty = null;
            this.awareInfoShown = false;
            this.familiarWithSpecifics = null;
            this.contextShown = false;
            this.contextDone = false;
            this.inActivity = false;
            this.currentIndex = 0;
            this.workingValue = 0;
            this.savedValues = {};
            this.reflection = '';
            localStorage.removeItem('landAck_savedValues');
            localStorage.removeItem('landAck_state');
        },

        // Item navigation
        nextItem() {
            if (this.currentIndex < this.items.length - 1) {
                this.currentIndex++;
                this.loadWorkingValue();
            }
        },
        prevItem() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.loadWorkingValue();
            }
        },
        skipItem() {
            // clear working value, move next
            this.workingValue = 0;
            this.nextItem();
        },
        saveValue() {
            const key = this.currentItem.key;
            const v = Number(this.workingValue || 0);
            this.$set(this.savedValues, key, v);
            this.persistState();
            alert('Value saved.');
        },
        clearValue() {
            const key = this.currentItem.key;
            this.workingValue = 0;
            if (this.savedValues[key] !== undefined) {
                this.$delete(this.savedValues, key);
                this.persistState();
            }
        },
        loadWorkingValue() {
            const key = this.currentItem.key;
            this.workingValue = this.savedValues[key] !== undefined ? this.savedValues[key] : 0;
        },

        affordCount(price) {
            if (!price || price <= 0) return '— set a price above';
            const count = Math.floor(this.totalSaved / price);
            const remainder = this.totalSaved % price;
            return `${count} (and $${this.formatNumber(remainder)} remaining)`;
        },

        formatNumber(n) {
            const num = Number(n || 0);
            return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
        },

        exportSummary() {
            const payload = {
                date: new Date().toISOString(),
                total: this.totalSaved,
                breakdown: this.savedValues,
                comparisons: this.comparisons,
                reflection: this.reflection
            };
            const txt = JSON.stringify(payload, null, 2);
            navigator.clipboard?.writeText(txt).then(() => {
                alert('Results copied to clipboard.');
            }, () => {
                // fallback
                prompt('Copy this text', txt);
            });
        },

        // Persistence
        persistState() {
            const state = {
                savedValues: this.savedValues,
                comparisons: this.comparisons,
                reflection: this.reflection,
                currentIndex: this.currentIndex
            };
            localStorage.setItem('landAck_savedValues', JSON.stringify(state));
        },
        loadState() {
            const raw = localStorage.getItem('landAck_savedValues');
            if (raw) {
                try {
                    const s = JSON.parse(raw);
                    this.savedValues = s.savedValues || {};
                    this.comparisons = s.comparisons || this.comparisons;
                    this.reflection = s.reflection || '';
                    this.currentIndex = s.currentIndex || 0;
                    this.loadWorkingValue();
                } catch (e) {
                    console.warn('Could not load saved state', e);
                }
            }
        }
    },
    watch: {
        savedValues: {
            deep: true,
            handler() { this.persistState(); }
        },
        comparisons: {
            deep: true,
            handler() { this.persistState(); }
        },
        reflection() { this.persistState(); }
    },
    mounted() {
        // on mount, load if user had partial progress
        this.loadState();
    }
});
