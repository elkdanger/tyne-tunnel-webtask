const osmosis = require('osmosis');
const axios = require('axios');

const config = {
  startPage: 'https://www.tt2.co.uk/s/web-user-login.html'
};

function sendBalanceUpdate(context, balance, done) {
  const msg = `Your current balance is now ${balance}`;
  
  axios.post(context.secrets.webhook_url, {
    json: {
      text: msg
    }
  }).then(() => {
    console.log(`Webhook sent with the content: ${msg}`);
    done(null);
  }).catch(err => {
    done(err);
  })
}

module.exports = function(context, done) {
  
  const formData = {
    email: context.secrets.tt_username,
    password: context.secrets.tt_password
  };
  
  const parseTableField = text => text.substr(text.indexOf(':') + 1).trim()
  
  osmosis
    .post(config.startPage, formData)
    .set({
      balance: '#balance > strong',
      name: '.details-left p:first',
      accountNumber: '.details-right p:eq(4)',
      customerId: '.details-right p:eq(5)',
      address: '.details-left p:eq(2)',
      city: '.details-left p:eq(3)',
      postcode: '.details-left p:eq(4)',
      telephone: '.details-left p:eq(5)',
      email: '.details-left p:eq(6)',
      lastActivity: '.details-right p:eq(1)',
      accountType: '.details-right p:eq(3)'
    })
    .data((d) => {
      if (d.balance) {
        const data = {
          currentBalance: parseFloat(d.balance.replace(/£([0-9.]+)/, '$1')),
          name: parseTableField(d.name),
          accountNumber: parseTableField(d.accountNumber),
          customerId: parseTableField(d.customerId),
          email: parseTableField(d.email),
          lastUpdated: new Date(),
          address: parseTableField(d.address),
          city: parseTableField(d.city),
          postcode: parseTableField(d.postcode),
          telephone: parseTableField(d.telephone),
          lastActivity: parseTableField(d.lastActivity),
          accountType: parseTableField(d.accountType)
        }
        
        sendBalanceUpdate(context, d.balance, (err, result) => done(err, { balance: d.balance }))

      } else {
        console.log(d);
        done(new Error('Balance update failed'))
      }
    })
    .log(msg => console.log(msg))
    .error(err => console.error(err))
};