export const menus = [
    {
        id: 1,
        label: 'Dashboard',
        url: '/dashboard'
    },
    {
        id: 2,
        label: 'Master',
        children: [
            {
                id: 21,
                label: 'Company',
                url: '/master-company'
            },
            {
                id: 22,
                label: 'Section',
                children: [
                    {
                        id: 221,
                        label: 'Section Master',
                        url: '/section-master'
                    }
                ]
            },
            {
                id: 23,
                label: 'Item',
                children: [
                    {
                        id: 231,
                        label: 'Item Group',
                        url: '/item-group'
                    },
                    {
                        id: 232,
                        label: 'Serving',
                        url: '/master-serving'
                    },
                    {
                        id: 233,
                        label: 'Category',
                        url: '/master-category'
                    },
                    {
                        id: 234,
                        label: 'Sub Category',
                        url: '/master-sub-category'
                    },
                    {
                        id: 235,
                        label: 'Sales Item',
                        url: '/master-sales-item'
                    }
                ]
            },
            {
                id: 24,
                label: 'Paymode',
                url: '/paymode'
            },
            {
                id: 25,
                label: 'Extra Charges',
                url: '/extra-charges'
            },
            {
                id: 26,
                label: 'Menu Rate Change',
                url: '/menu-rate-change'
            },
            {
                id: 27,
                label: 'Status Master',
                url: '/status-master'
            },
            {
                id: 28,
                label: 'Event Master',
                url: '/event-master'
            },
            {
                id: 29,
                label: 'Function Master',
                url: '/function-master'
            },
            {
                id: 30,
                label: 'Package Master',
                url: '/package-master'
            },
            {
                id: 31,
                label: ' Item Package Master',
                url: '/item-package-master'
            },

        ]
    }

]