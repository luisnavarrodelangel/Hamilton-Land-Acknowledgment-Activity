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
        showSummary: false,

        // Items (from your list)
        items: [
            // { key: 'clothing_generic', name: 'Clothing (various cloths & pieces)', desc: 'Includes bales of stroud, molton, broad cloth, serge, patterned flannel, trunks of linen, ribbons, hats and related cloth items.' },
            { key: 'stroud', name: '4 bales of stroud', img: "images/balesOfStroud.png", desc: 'Beads used to make necklaces, bracelets, and clothing embellishments.' },
            { key: 'molton', name: '3 bales of molton cloth', img: "images/balesOfMolton.png", desc: 'Gartering used for clothing and personal items.' },
            { key: 'broad', name: '1 bale of broad cloth', img: "images/broadcloth.png", desc: 'Three boxes of guns (firearms).' },
            { key: 'serge', img: "images/serge.png", name: '3 pieces of embossed serge, a fabric used to make clothing', desc: 'Six half-sized barrels of gun powder.' },
            { key: 'flannel', img: "images/flanel.png", name: '1 bale of patterned flannel cloth', desc: 'Cases of lead shot and kegs of lead balls, used as ammunition.' },
            { key: 'linen', img: "images/linen.png", name: '3 trunks of linen cloth', desc: 'Approximately 1,400 gun flints used for ignition.' },
            { key: 'laced_hats', img: "images/lacedHat.png", name: '17 laced hats', desc: 'Tools that could be used for farming and daily tasks.' },
            { key: 'hats', img: "images/hats.png", name: '1 box of 60 hats', desc: 'Consumable goods sometimes given as part of exchanges.' },
            // { key: 'brass_kettles', name: 'Brass kettles', desc: 'Used for cooking and families\' daily tasks.' },
            // { key: 'looking_glasses', name: 'Looking glasses (mirrors)', desc: 'Handheld or small framed mirrors.' },
            // { key: 'fish_hooks', name: 'Fish hooks', desc: 'Fishing gear for food procurement.' },
            // { key: 'blankets', name: 'Blankets', desc: 'Woven blankets for warmth and trade.' },
            // { key: 'ribbons_case', name: 'Ribbons & small items', desc: 'Pieces of ribbon, embellishments, and small trade goods.' }
        ],

        reflectionQuestions: [
            "How did you decide how much value to assign to each item?",
            "Were there any items you valued more or less than expected?",
            "How would your allocations change if you had more (or fewer) resources?",
            "What do your choices reveal about your priorities?"
        ],
        currentIndex: 0,
        workingValue: 0,
        maxValue: 100000, // slider max — large enough for flexibility
        savedValues: {},

        // Comparisons (editable)
        comparisons: {
            house: { label: 'Average house in Hamilton', price: "$767,654"},
            land: { label: 'Small urban lot', price: "$700,000–$900,000+" },
            car: { label: 'New small car', price: "$26,565" }
        },
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

        calculateAndNext() {
            const total = Object.values(this.savedValues).reduce((a, b) => a + (b || 0), 0);
            this.totalValue = total;
            this.inActivity = false;
            this.showSummary = true;
        },
        formatCurrency(value) {
            if (value === undefined) return "$0.00";
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD"
            }).format(value);
        },
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
            // if (!confirm('Reset this activity? This will clear saved values and answers.')) return;
            this.started = false;
            this.isHamilton = null;
            this.awareOfTreaty = null;
            this.awareInfoShown = false;
            this.familiarWithSpecifics = null;
            this.contextShown = false;
            this.contextDone = false;
            this.inActivity = false;
            this.showSummary=false;
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
