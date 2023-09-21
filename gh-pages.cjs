var ghpages = require('gh-pages');

ghpages.publish(
    'public',
    {
        branch: 'gh-pages',
        repo: 'https://github.coecis.cornell.edu/be99/high-tunnel.git',
        user: {
            name: 'Ben Eck',
            email: 'be99@cornell.edu'
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)