const osmosis = require('osmosis');
const request = require('request');

const config = {
  startPage: 'https://www.tt2.co.uk/s/web-user-login.html'
};

function sendBalanceUpdate(context, balance, done) {
  const msg = `Your current balance is now ${balance}`;
  
  console.log(`Sending balance update to webhook: ${msg}`)
  
  request.post(context.secrets.webhook_url, {
    json: {
      text: msg
    }
  })
}

module.exports = function(context, done) {
  
  const formData = {
    email: context.secrets.tt_username,
    password: context.secrets.tt_password
  };

  const parseTableField = text => text.substr(text.indexOf(':') + 1).trim()
  
  context.storage.get((err, storageData) => {
    if (err) {
      done(err);
      return
    }
      
    storageData = storageData || { balance: 0 };
    
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
          
          const result = {
            balance: data.currentBalance
          };
          
          context.storage.set(result, err => {
            if (err) {
              done(err)
            } else {
              if (storageData.balance !== result.balance) {
                sendBalanceUpdate(context, d.balance);
              }
              
              done(null, result);
            }
          });
        } else {
          done(new Error('Balance update failed'))
        }
      })
      .log(msg => console.log(msg))
      .error(err => console.error(err));
  })
};