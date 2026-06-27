    function productListApp() {
        return {
            init() {
                const urlParams = new URLSearchParams(window.location.search);
                const expandProductName = urlParams.get('expand_product_name');
                const openProduct = urlParams.get('open_product');

                if (openProduct) {
                    this.$nextTick(() => {
                        this.openProductModal(openProduct);
                    });
                } else if (expandProductName) {
                    this.$nextTick(() => {
                        const rows = document.querySelectorAll('tr[data-searchable]:not([data-lot-header="true"])');
                        const matchingRows = Array.from(rows).filter(row => {
                            const name = row.dataset.name || '';
                            return name.toLowerCase() === expandProductName.toLowerCase();
                        });

                        if (matchingRows.length === 1) {
                            const row = matchingRows[0];
                            const lotId = row.dataset.lotId || 'unassigned';
                            this.collapsedLots[lotId] = false;
                            const productId = row.dataset.productId;
                            this.openProductModal(productId);
                        } else if (matchingRows.length > 1) {
                            matchingRows.forEach(row => {
                                const lotId = row.dataset.lotId || 'unassigned';
                                this.collapsedLots[lotId] = false;

                                // Highlight
                                const originalBg = row.style.backgroundColor;
                                row.style.backgroundColor = '#fef3c7';
                                setTimeout(() => {
                                    row.style.backgroundColor = originalBg;
                                }, 3000);
                            });

                            if (matchingRows.length > 0) {
                                matchingRows[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }
                    });
                }
                this.initPart2();
            },

            // ── UI State ──
            isSearching: false,
            bulkOpen: false,
            searchOpen: false,
            showUnpricedOnly: false,
            showBookmarkedOnly: false,



            // ── Inline Edit State ──
            editingRowId: null,
            editData: {},
            enableInlineEdit(rowElement) {
                if (this.productModalOpen) return;
                const productId = rowElement.dataset.productId;
                if (!productId) return;
                this.editingRowId = productId;
                this.editData = {
                    sl_no: rowElement.dataset.slNo || '',
                    item_name: rowElement.dataset.name || '',
                    make_or_model: rowElement.dataset.brand || '',
                    description: rowElement.dataset.description || '',
                    quantity: rowElement.dataset.qty || '',
                    uom: rowElement.dataset.uom || '',
                    selling_price_ex_gst: rowElement.dataset.sellingPrice || ''
                };
            },
            cancelInlineEdit() {
                this.editingRowId = null;
                this.editData = {};
            },
            async saveInlineEdit() {
                if (!this.editingRowId) return;
                try {
                    const response = await fetch(`/api/product/${this.editingRowId}/inline-update/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                        },
                        body: JSON.stringify(this.editData)
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            window.location.reload();
                        } else {
                            alert(data.error || 'Failed to update');
                        }
                    }
                } catch (e) {
                    console.error(e);
                    alert('An error occurred');
                }
            },
            handleGlobalKeydown(e) {
                if (e.key === 'Escape') {
                    if (this.productModalOpen) {
                        this.productModalOpen = false;
                    } else if (this.editingRowId) {
                        this.cancelInlineEdit();
                    }
                }
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                    if (this.productModalOpen) {
                        e.preventDefault();
                        const submitBtn = document.querySelector('#product-info-form button[type="submit"]');
                        if (submitBtn) submitBtn.click();
                    } else if (this.editingRowId) {
                        e.preventDefault();
                        this.saveInlineEdit();
                    }
                }
            },

            // ── Data ──
            lotTotals: {},

            // ── Bulk Edit Attributes ──
            bulkEditLoading: false,

            purchasedProducts: {
            {% for p in products %} '{{ p.id }}': {% if p.is_purchased %} true{% else %} false{% endif %}, {% endfor %}
    },
    collapsedLots: {
        {% for p in products %} {% ifchanged p.lot %} '{{ p.lot.id|default:"unassigned" }}': true, {% endifchanged %} {% endfor %}
        },

    // ── Search / Filter ──
    searchName: '',
        searchSpec: '',
            priceMin: '',
                priceMax: '',
                    searchBrands: [],
                        searchSupplier: '',
                            searchStatus: '',

                                // ── Bookmark ──
                                bookmarkModalOpen: false,
                                    bookmarkProductId: null,
                                        bookmarkDescription: '',
                                            bookmarkAction: 'add',

                                                // ── Advanced Export ──
                                                exportModalOpen: false,
                                                    exportLots: [],
                                                        exportHeaders: [
                                                            { id: 'Sl No.', label: 'Sl No.', checked: true },
                                                            { id: 'Item Name', label: 'Item Name', checked: true },
                                                            { id: 'Brand', label: 'Brand', checked: true },
                                                            { id: 'Description', label: 'Description', checked: true },
                                                            { id: 'Supplier', label: 'Supplier', checked: true },
                                                            { id: 'Supplier Contact', label: 'Supplier Contact', checked: true },
                                                            { id: 'Supplier Email', label: 'Supplier Email', checked: false },
                                                            { id: 'Supplier Product Link', label: 'Supplier Product Link', checked: false },
                                                            { id: 'Quantity', label: 'Quantity', checked: true },
                                                            { id: 'Unit Price (Ex. GST)', label: 'Unit Price (Ex. GST)', checked: true },
                                                            { id: 'Unit Price (Inc. GST)', label: 'Unit Price (Inc. GST)', checked: true },
                                                            { id: 'Total Price (Ex. GST)', label: 'Total Price (Ex. GST)', checked: true },
                                                            { id: 'Total Price (Inc. GST)', label: 'Total Price (Inc. GST)', checked: true },
                                                            { id: 'Selling Price (Ex. GST)', label: 'Selling Price (Ex. GST)', checked: false },
                                                            { id: 'Selling Price (Inc. GST)', label: 'Selling Price (Inc. GST)', checked: false },
                                                            { id: 'Purchased', label: 'Purchased', checked: true },
                                                            { id: 'Status', label: 'Status', checked: true },
                                                            { id: 'Remark', label: 'Remark', checked: true }
                                                        ],

                                                            // ── Counters ──
                                                            visibleCount: 0,
                                                                visibleTotalExGst: 0,
                                                                    visibleTotalIncGst: 0,

                                                                        // ── Product Detail Modal ──
                                                                        productModalOpen: false,
                                                                            productModalLoading: false,
                                                                                currentProductId: null,
                                                                                    modalHtml: '',

                                                                                        // ════════════════════════════════════════════
                                                                                        // Lifecycle
                                                                                        // ════════════════════════════════════════════
                                                                                        initPart2() {
        this.applyFilter();

        // Extract lots for export modal
        const lotRows = document.querySelectorAll('tr[data-lot-header="true"]');
        this.exportLots = Array.from(lotRows).map(row => {
            const id = row.dataset.lotId;
            const nameSpan = row.querySelector('span.text-sm');
            const name = nameSpan ? nameSpan.innerText.trim() : (id === 'unassigned' ? 'Unassigned Products' : 'Unknown Lot');
            return { id, name, checked: true };
        });

        const storageKey = 'lastExpandedLotId_{{ order.id }}';
        let targetLotId = null;

        {% if request.GET.open_lot_id %}
        targetLotId = '{{ request.GET.open_lot_id }}';
        {% else %}
        targetLotId = sessionStorage.getItem(storageKey);
        {% endif %}

        if (targetLotId && targetLotId in this.collapsedLots) {
            // Ensure all others are collapsed first
            for (let key in this.collapsedLots) {
                this.collapsedLots[key] = true;
            }
            this.collapsedLots[targetLotId] = false;
            sessionStorage.setItem(storageKey, targetLotId);

            // Clean up URL so it doesn't get stuck on refresh
            if (window.history && window.history.replaceState) {
                const url = new URL(window.location.href);
                if (url.searchParams.has('open_lot_id')) {
                    url.searchParams.delete('open_lot_id');
                    window.history.replaceState({}, '', url);
                }
            }
        }
    },

    // ════════════════════════════════════════════
    // Lot Collapse / Expand
    // ════════════════════════════════════════════
    toggleLot(lotId) {
        const currentlyExpanded = this.collapsedLots[lotId] === false;

        // Reassign the whole object to trigger Alpine reactivity
        const newCollapsedLots = {};
        for (let key in this.collapsedLots) {
            newCollapsedLots[key] = true;
        }

        if (!currentlyExpanded) {
            newCollapsedLots[lotId] = false;
            const storageKey = 'lastExpandedLotId_{{ order.id }}';
            sessionStorage.setItem(storageKey, lotId);
        }
        
        this.collapsedLots = newCollapsedLots;
    },

    // ════════════════════════════════════════════
    // Row styling helper
    // ════════════════════════════════════════════
    getRowClass(productId, isBookmarked, hasLot, hasPendingRequest = false) {
        const borderClass = hasLot ? 'border-l-[3px] border-l-cyan-400' : 'border-l-[3px] border-l-transparent';
        if (hasPendingRequest) {
            return 'bg-orange-50 hover:bg-orange-100 border-y border-orange-300 ' + borderClass;
        }
        if (this.purchasedProducts[productId]) {
            return 'bg-emerald-50/65 hover:bg-emerald-100/70 ' + borderClass;
        }
        if (isBookmarked) {
            return 'bg-amber-50/65 hover:bg-amber-100/70 ' + borderClass;
        }
        return 'hover:bg-gray-50 ' + borderClass;
    },

        // ════════════════════════════════════════════
        // Product Detail Modal
        // ════════════════════════════════════════════
        async openProductModal(productId) {
        this.currentProductId = productId;
        this.productModalOpen = true;
        this.productModalLoading = true;
        this.modalHtml = '';

        try {
            const response = await fetch('/product/' + productId + '/modal/');
            if (response.ok) {
                const html = await response.text();
                this.modalHtml = html;
                this.productModalLoading = false;

                this.$nextTick(() => {
                    const modalContainer = document.getElementById('product-modal-content-container');
                    if (!modalContainer) return;

                    modalContainer.innerHTML = html;
                    modalContainer.dataset.productId = productId;

                    // Safely execute inline scripts from the injected HTML
                    modalContainer.querySelectorAll('script').forEach(oldScript => {
                        if (oldScript.src) {
                            const newScript = document.createElement('script');
                            newScript.src = oldScript.src;
                            document.head.appendChild(newScript);
                        } else {
                            try {
                                new Function(oldScript.textContent)();
                            } catch (err) {
                                console.error('Modal script error:', err);
                                if (window.showGlobalNotification) {
                                    window.showGlobalNotification('Modal script error: ' + err.message, 'error');
                                }
                            }
                        }
                    });

                    // Initialize Alpine components in the new HTML
                    if (window.Alpine) {
                        window.Alpine.initTree(modalContainer);
                    }

                    // Initialize drag & drop file upload listeners
                    if (typeof setupImageUploadListeners === 'function') {
                        setupImageUploadListeners();
                    }

                    console.log('Modal injected successfully');
                });
            } else {
                console.error('Failed to load modal content');
                this.productModalLoading = false;
                this.modalHtml = '<div class="p-6 text-center text-red-500">Failed to load product details.</div>';
                document.getElementById('product-modal-content-container').innerHTML = this.modalHtml;
            }
        } catch (error) {
            console.error('Error:', error);
            this.productModalLoading = false;
            this.modalHtml = '<div class="p-6 text-center text-red-500">An error occurred while loading details.</div>';
            document.getElementById('product-modal-content-container').innerHTML = this.modalHtml;
        }
    },

        async reloadModalContent() {
        if (this.currentProductId) {
            await this.openProductModal(this.currentProductId);
        }
    },

    // ════════════════════════════════════════════
    // Navigate between products in modal
    // ════════════════════════════════════════════
    navigateProduct(direction) {
        if (!this.currentProductId) return;
        const currentRow = document.querySelector("tr[data-product-id='" + this.currentProductId + "']");
        if (!currentRow) return;

        const allRows = Array.from(document.querySelectorAll('tr[data-searchable]')).filter(row =>
            row.dataset.lotHeader !== 'true' &&
            !row.classList.contains('hidden-by-filter')
        );

        const currentIndex = allRows.indexOf(currentRow);
        if (currentIndex === -1) return;

        let newIndex;
        if (direction === 'next') {
            newIndex = currentIndex + 1;
        } else if (direction === 'prev') {
            newIndex = currentIndex - 1;
        }

        if (newIndex >= 0 && newIndex < allRows.length) {
            const nextRow = allRows[newIndex];
            this.openProductModal(nextRow.dataset.productId);
        }
    },

        // ════════════════════════════════════════════
        // Toggle Purchase Status
        // ════════════════════════════════════════════
        async togglePurchase(productId, purchased) {
        try {
            const response = await fetch('/product/' + productId + '/toggle-purchase/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': '{{ csrf_token }}'
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.purchasedProducts[productId] = data.is_purchased;
                    const row = document.querySelector("tr[data-product-id='" + productId + "']");
                    if (row) {
                        row.dataset.purchased = data.is_purchased ? 'true' : 'false';
                    }
                }
            }
        } catch (e) {
            console.error('Error toggling purchase status:', e);
        }
    },

        // ════════════════════════════════════════════
        // Submit Modal Form (Save Details etc.)
        // ════════════════════════════════════════════
        async submitModalForm(formId, actionName) {
        const form = document.getElementById(formId);
        if (!form) return;

        const formData = new FormData(form);
        formData.set('action', actionName);

        try {
            const csrfInput = form.querySelector('input[name=csrfmiddlewaretoken]')
                || document.querySelector('input[name=csrfmiddlewaretoken]');
            const csrfToken = csrfInput ? csrfInput.value : '{{ csrf_token }}';

            const response = await fetch('/product/' + this.currentProductId + '/modal/', {
                method: 'POST',
                body: formData,
                headers: { 'X-CSRFToken': csrfToken }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.reloadModalContent();
                    window.showGlobalNotification(data.message || 'Details saved successfully!', 'success');
                } else {
                    let errMsg = Object.values(data.errors || {}).join(', ') || 'Validation error';
                    window.showGlobalNotification('Error: ' + errMsg, 'error');
                }
            } else {
                window.showGlobalNotification('Server error occurred while saving.', 'error');
            }
        } catch (e) {
            console.error('Error saving modal form:', e);
            window.showGlobalNotification('An error occurred while saving.', 'error');
        }
    },

        // ════════════════════════════════════════════
        // Submit Modal Action (generic actions)
        // ════════════════════════════════════════════
        async submitModalAction(actionName, payload) {
        const formData = new FormData();
        formData.append('action', actionName);
        for (const [key, value] of Object.entries(payload)) {
            formData.append(key, value);
        }

        try {
            const csrfInput = document.querySelector('input[name=csrfmiddlewaretoken]');
            const csrfToken = csrfInput ? csrfInput.value : '{{ csrf_token }}';

            const response = await fetch('/product/' + this.currentProductId + '/modal/', {
                method: 'POST',
                body: formData,
                headers: { 'X-CSRFToken': csrfToken }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.reloadModalContent();
                    window.showGlobalNotification('Action completed successfully!', 'success');
                } else {
                    let errMsg = Object.values(data.errors || {}).join(', ') || 'Validation error';
                    window.showGlobalNotification('Error: ' + errMsg, 'error');
                }
            } else {
                window.showGlobalNotification('Server error occurred.', 'error');
            }
        } catch (e) {
            console.error('Error performing modal action:', e);
            window.showGlobalNotification('An error occurred.', 'error');
        }
    },

    // ════════════════════════════════════════════════════
    // Search Autocomplete
    // ════════════════════════════════════════════════════

    // Data baked in by Django at render time
    _allSellers: { { suppliers |default: "[]" | safe } },
    _allLocations: { { locations |default: "[]" | safe } },
    _suggItems: [],   // flat list of currently visible suggestions
        _suggIdx: -1,   // keyboard-navigation cursor

            showSearchSuggestions() {
        const q = (this.searchName || '').toLowerCase().trim();
        const box = document.getElementById('search-suggestions');
        if (!box) return;

        const matchSellers = this._allSellers.filter(s => s.toLowerCase().includes(q));
        const matchLocations = this._allLocations.filter(l => l.toLowerCase().includes(q));

        this._suggItems = [
            ...matchSellers.map(s => ({ label: s, type: 'seller' })),
            ...matchLocations.map(l => ({ label: l, type: 'location' })),
        ];
        this._suggIdx = -1;

        const sellersWrap = document.getElementById('sugg-sellers');
        const locationsWrap = document.getElementById('sugg-locations');
        const emptyEl = document.getElementById('sugg-empty');
        const sellersList = document.getElementById('sugg-sellers-list');
        const locationsList = document.getElementById('sugg-locations-list');

        const iconSeller = `<svg class="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>`;
        const iconLocation = `<svg class="h-3.5 w-3.5 text-teal-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`;

        const buildLi = (item, idx) => {
            const icon = item.type === 'seller' ? iconSeller : iconLocation;
            return `<li data-sugg-idx="${idx}"
                            onmousedown="event.preventDefault()"
                            onclick="document.getElementById('product-search-input')._x_model.set('${item.label.replace(/'/g, "\\'")}'); Alpine.store || null;"
                            class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors sugg-item">
                            ${icon}
                            <span>${item.label}</span>
                        </li>`;
        };

        if (matchSellers.length) {
            sellersList.innerHTML = matchSellers.map((s, i) => buildLi({ label: s, type: 'seller' }, i)).join('');
            sellersWrap.classList.remove('hidden');
        } else {
            sellersWrap.classList.add('hidden');
        }

        const sellerCount = matchSellers.length;
        if (matchLocations.length) {
            locationsList.innerHTML = matchLocations.map((l, i) => buildLi({ label: l, type: 'location' }, sellerCount + i)).join('');
            locationsWrap.classList.remove('hidden');
        } else {
            locationsWrap.classList.add('hidden');
        }

        if (!matchSellers.length && !matchLocations.length) {
            emptyEl.classList.remove('hidden');
        } else {
            emptyEl.classList.add('hidden');
        }

        // Only show dropdown when there's something to show
        if (this._suggItems.length || q.length === 0) {
            box.classList.toggle('hidden', this._suggItems.length === 0);
        }

        // Wire up click-to-fill for all items
        box.querySelectorAll('.sugg-item').forEach(li => {
            li.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const idx = parseInt(li.dataset.suggIdx, 10);
                if (!isNaN(idx)) this._fillSuggestion(idx);
            });
        });
    },

    hideSearchSuggestions() {
        const box = document.getElementById('search-suggestions');
        if (box) box.classList.add('hidden');
        this._suggIdx = -1;
    },

    moveSuggestion(dir) {
        const max = this._suggItems.length - 1;
        if (max < 0) return;
        this._suggIdx = Math.max(0, Math.min(max, this._suggIdx + dir));
        document.querySelectorAll('.sugg-item').forEach(li => {
            const active = parseInt(li.dataset.suggIdx, 10) === this._suggIdx;
            li.classList.toggle('bg-indigo-50', active);
            li.classList.toggle('text-indigo-800', active);
        });
    },

    acceptSuggestion() {
        if (this._suggIdx >= 0) {
            this._fillSuggestion(this._suggIdx);
        } else {
            this.hideSearchSuggestions();
        }
    },

    _fillSuggestion(idx) {
        const item = this._suggItems[idx];
        if (!item) return;
        this.searchName = item.label;
        this.applyFilter();
        this.hideSearchSuggestions();
    },

    // ════════════════════════════════════════════
    // Search & Filter
    // ════════════════════════════════════════════
    matchesSearch(row) {
        const name = (row.dataset.name || '').toLowerCase();
        const spec = (row.dataset.spec || '').toLowerCase();
        const price = parseFloat(row.dataset.price) || 0;
        const brand = (row.dataset.brand || '').trim();
        const supplier = (row.dataset.supplier || '').trim();
        const status = (row.dataset.status || '').trim();
        const isLotHeader = row.dataset.lotHeader === 'true';

        if (isLotHeader) return true;

        let match = true;

        // Universal Search
        if (this.searchName) {
            const query = this.searchName.toLowerCase();
            const buyerName = '{{ order.customer_name|default:""|escapejs }}'.toLowerCase();
            const buyerLocation = '{{ order.location|default:""|escapejs }}'.toLowerCase();
            const orderNum = '{{ order.order_number|default:""|escapejs }}'.toLowerCase();
            const description = (row.dataset.description || '').toLowerCase();
            const supplierLoc = (row.dataset.supplierLocation || '').toLowerCase();
            const searchStr = name + ' ' + spec + ' ' + brand.toLowerCase() + ' ' + supplier.toLowerCase() + ' ' + description + ' ' + buyerName + ' ' + buyerLocation + ' ' + orderNum + ' ' + supplierLoc;
            if (!searchStr.includes(query)) {
                match = false;
            }
        }

        if (this.searchSpec && !spec.includes(this.searchSpec.toLowerCase())) match = false;
        if (this.priceMin !== '' && price < parseFloat(this.priceMin)) match = false;
        if (this.priceMax !== '' && price > parseFloat(this.priceMax)) match = false;
        if (this.showBookmarkedOnly && row.dataset.bookmarked !== 'true') match = false;
        if (this.showUnpricedOnly && row.dataset.hasPrice === 'true') match = false;

        // Brand filter (multi-select)
        if (this.searchBrands.length > 0) {
            let brandMatch = false;
            if (this.searchBrands.includes('none') && brand === '') {
                brandMatch = true;
            }
            const productBrands = brand.split(/[,/;]/).map(b => b.trim().toLowerCase());
            this.searchBrands.forEach(sb => {
                if (sb !== 'none' && productBrands.includes(sb.toLowerCase())) {
                    brandMatch = true;
                }
            });
            if (!brandMatch) match = false;
        }

        // Supplier filter
        if (this.searchSupplier) {
            if (supplier.toLowerCase() !== this.searchSupplier.toLowerCase()) match = false;
        }

        // Status filter
        if (this.searchStatus) {
            if (status.toUpperCase() !== this.searchStatus.toUpperCase()) match = false;
        }

        return match;
    },

    applyFilter() {
        let count = 0;
        let totalEx = 0;
        let totalInc = 0;
        let newLotTotals = {};
        let lotsWithMatches = new Set();
        this.isSearching = !!(this.searchName || this.searchSpec || this.priceMin || this.priceMax || this.searchBrands.length > 0 || this.searchSupplier || this.searchStatus || this.showBookmarkedOnly || this.showUnpricedOnly);

        document.querySelectorAll('tr[data-searchable][data-lot-header="true"]').forEach(row => {
            const lotId = row.dataset.lotId || 'unassigned';
            newLotTotals[lotId] = { buyTotalEx: 0, buyTotalInc: 0, sellTotalEx: 0, sellTotalInc: 0 };
        });

        document.querySelectorAll('tr[data-searchable]:not([data-lot-header="true"])').forEach(row => {
            const matches = this.matchesSearch(row);
            if (matches) {
                row.classList.remove('hidden-by-filter');
                count++;
                const qty = parseFloat(row.dataset.qty) || 0;
                const basePrice = parseFloat(row.dataset.price) || 0;
                const incPrice = parseFloat(row.dataset.priceInc) || 0;
                const sellPriceEx = parseFloat(row.dataset.sellingPrice) || 0;
                const sellPriceInc = parseFloat(row.dataset.sellingPriceInc) || 0;

                totalEx += qty * basePrice;
                totalInc += qty * incPrice;

                const lotId = row.dataset.lotId || 'unassigned';
                lotsWithMatches.add(lotId);
                if (newLotTotals[lotId]) {
                    newLotTotals[lotId].buyTotalEx += qty * basePrice;
                    newLotTotals[lotId].buyTotalInc += qty * incPrice;
                    newLotTotals[lotId].sellTotalEx += qty * sellPriceEx;
                    newLotTotals[lotId].sellTotalInc += qty * sellPriceInc;
                }
            } else {
                row.classList.add('hidden-by-filter');
            }
        });

        document.querySelectorAll('tr[data-searchable][data-lot-header="true"]').forEach(row => {
            const lotId = row.dataset.lotId || 'unassigned';
            if (this.isSearching && !lotsWithMatches.has(lotId)) {
                row.classList.add('hidden-by-filter');
            } else {
                row.classList.remove('hidden-by-filter');
            }
        });

        this.lotTotals = newLotTotals;
        this.visibleCount = count;
        this.visibleTotalExGst = totalEx;
        this.visibleTotalIncGst = totalInc;
    },

    clearFilters() {
        this.searchName = '';
        this.searchSpec = '';
        this.priceMin = '';
        this.priceMax = '';
        this.searchBrands = [];
        this.searchSupplier = '';
        this.showBookmarkedOnly = false;
        this.showUnpricedOnly = false;
        this.applyFilter();
