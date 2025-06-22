// This function builds a tree node structure for Treant.js
function buildTreeNode(distributor, collapsed = false) {
    if (!distributor) {
        console.error("buildTreeNode received an undefined or null ‘distributor’ object.");
        return null;
    }

    // Determina el color del punto de estado
    const statusClass = distributor.status === 'Active' ? 'status-active' : 'status-inactive';

    const node = {
        text: {
            name: distributor.full_name ?? "No Name",
            title: distributor.username ?? "No Username",
            category: distributor.category_name ?? "No Category",
            contact: distributor.product_name ?? "No Product",
            desc: distributor.status ?? "No Status",
            // Placement only for purifying purposes
            // placement: distributor.binary_placement ?? "No Placement",
        },
        HTMLclass: `${statusClass}`,
        collapsed: collapsed,
        children: []
    };

    if (Array.isArray(distributor.children) && distributor.children.length > 0) {
        // Order by binary placement
        const sortedChildren = [...distributor.children].sort((a, b) => {
            // Assumes that ‘Left’ must come before ‘Right’.
            if (a.binary_placement === 'Left' && b.binary_placement === 'Right') {
                return -1;
            }
            if (a.binary_placement === 'Right' && b.binary_placement === 'Left') {
                return 1;
            }
            return 0; // Maintain relative order if equal or undefined
        });

        node.children = sortedChildren.map(child =>
            buildTreeNode(child, true) // Collapsed children by default
        );
    }

    return node;
}

async function initTreantWithData() {
    try {
        const response = await fetch('./daxcsa.json');
        const rawData = await response.json();

        if (!rawData || !rawData.data || !Array.isArray(rawData.data.attributes) || rawData.data.attributes.length === 0) {
            throw new Error("The structure of daxcsa.json is not as expected (data.attributes is missing or empty).");
        }

        const rootDistributorData = rawData.data.attributes[0];

        if (!rootDistributorData || typeof rootDistributorData.full_name === 'undefined') {
            throw new Error("The root distributor object does not have the expected properties or is null.");
        }

        const chart_config = {
            chart: {
                container: "#collapsable-example",
                animateOnInit: true,
                connectors: {
                    type: 'step'
                },
                node: {
                    collapsable: true
                },
                animation: {
                    nodeAnimation: "easeOutBounce",
                    nodeSpeed: 700,
                    connectorsAnimation: "bounce",
                    connectorsSpeed: 700
                }
            },
            nodeStructure: buildTreeNode(rootDistributorData)
        };

        if (typeof Treant !== 'undefined') {
            const tree = new Treant(chart_config); // Store the instance of the tree

            // --- Perfect Scrollbar inicialization ---
            // Only if Perfect Scrollbar and jQuery are loaded.
            if (typeof jQuery !== 'undefined' && typeof jQuery.fn.perfectScrollbar !== 'undefined') {
                const chartContainer = document.querySelector('#collapsable-example');
                if (chartContainer) {
                    // Initialize Perfect Scrollbar in the chart container
                    $(chartContainer).perfectScrollbar();

                    tree.on('afterUpdate', function() { $(chartContainer).perfectScrollbar('update'); });
                    setTimeout(() => {
                        $(chartContainer).perfectScrollbar('update');
                    }, 800);
                }
            } else {
                console.warn("Perfect Scrollbar or jQuery is not loaded. Custom scrolling will not work.");
            }

        } else {
            console.error("Treant.js is not loaded. Make sure Treant.js is loaded before collapsable.js.");
        }

    } catch (error) {
        console.error("Error loading JSON data or initializing Treant:", error);
    }
}

document.addEventListener('DOMContentLoaded', initTreantWithData);