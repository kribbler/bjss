"use strict"; 

var currencyUrl = 'http://www.apilayer.net/api/live?access_key=547dd4e9a9fd0fee5a77c643c69d4cd2&format=1&currencies=USD,GBP,EUR',
	defaultCurrency = 'USD',
	errorNoProducts = 'No products',
	errorNoCurrencyRates = 'Unable to fetch currency Rates';

/**
	Name: 	getProducts() 
	Desc: 	create an array with some sample products
	Params: -
*/
function getProducts() {
	var products = [];
	products.push({
		'name': 'Peas',
		'per': 'bag',
		'price': '.95',
		'currency': 'USD',
		'quantity': 0,
	});
	products.push({
		'name': 'Eggs',
		'per': 'dozen',
		'price': '2.10',
		'currency': 'USD',
		'quantity': 0,
	});
	products.push({
		'name': 'Milk',
		'per': 'bottle',
		'price': '1.30',
		'currency': 'USD',
		'quantity': 0,
	});
	products.push({
		'name': 'Beans',
		'per': 'can',
		'price': '.73',
		'currency': 'USD',
		'quantity': 0,
	});

	return products;
}

function initAccounting() {
	accounting.settings = {
		currency: {
			symbol : "USD",   // default currency symbol is '$'
			format: "%s %v", // controls output: %s = symbol, %v = value/number (can be object: see below)
			decimal : ".",  // decimal point separator
			thousand: ",",  // thousands separator
			precision : 2   // decimal places
		},
		number: {
			precision : 0,  // default precision on numbers is 0
			thousand: ",",
			decimal : "."
		}
	}
}

/**
	Name: 	displayProducts() 
	Desc: 	build and display an html code containing products list
	Params: products
*/
function displayProducts(products) {
	_.each(products, function(product) {
		var tpl = '<li class="list-group-item">' +
		  	'<div class="container-fluid">' + 
		  		'<div class="row">' + 
		  			'<div class="col-md-4 productName">' + 
		  			product.name +
		  			'</div>' + 
		  			'<div class="col-md-5">' + 
		  			accounting.formatMoney(product.price) + ' per ' + product.per +
		  			'</div>' + 
		  			'<div class="col-md-3">' + 
		  				'<div class="form-group">' + 
							'<input type="text" onkeypress="return event.charCode >= 48 && event.charCode <= 57" class="form-control quantities" placeholder="Qty." data-id='+product.name+'>' + 
						'</div>' + 
		  			'</div>' + 
		  		'</div>' + 
		  	'</div>' + 
		  '</li>';

		$('#productsList').append(tpl);

	});
}

/**
	Name: 	getTotalAmount() 
	Desc: 	calculate the cart total amount
	Params: -
*/
function getTotalAmount() {
	var totalAmount = 0;
	_.each(products, function(product) {
		totalAmount += product.price * product.quantity;
	});
	return totalAmount.toFixed(2);
}

/**
	Name: 	displayTotalAmount() 
	Desc: 	display the cart total amount and show the currency converter dropdown
	Params: -
*/
function displayTotalAmount() {
	var totalAmount = getTotalAmount();
	$('#total').html(totalAmount);
	$('#currentCurrency').html(defaultCurrency);
	$('#basketTotal').removeClass('d-none');
	displayCurrencyConverter();
}

/**
	Name: 	displayCurrencyConverter() 
	Desc: 	build and display an html code containing currency list
	Params: -
*/
function displayCurrencyConverter() {
	var tpl = '';
	_.each(currencyRates, function(row) {
		tpl += '<button class="dropdown-item" type="button" data-currency="'+row.currency+'" data-quote="'+row.quote+'">'+row.currency+'</button>';
	});

	$('#dropdownCurencies').html(tpl);
	$('#currencyConverter').removeClass('d-none');

	listenToCurrencyChange();
}

/**
	Name: 	listenToCurrencyChange() 
	Desc: 	change the displayed total amount based on selected currency
	Params: -
*/
function listenToCurrencyChange() {
	$('.dropdown-item').click(function(e) {
		var el = $(e.currentTarget);
		var quote = el.data('quote');
		var currency = el.data('currency');
		$('#currentCurrency').html(currency);
		var totalAmount = getTotalAmount();
		totalAmount = (totalAmount * quote).toFixed(2);
		$('#total').html(totalAmount);
	});
}

/**
	Name: 	getCurrencyRates() 
	Desc: 	read external api and return currency rates
	Params: -
*/
var getCurrencyRates = function() {
	var response = [];
	// 1 / gbp rate = usd rate
	$.getJSON(currencyUrl, {}, function(data) {
		if (data.success) {
			_.each(data.quotes, function(quote, index) {
				response.push({
					'currency': index.replace('USD', ''),
					'quote': quote
				});
			});
		} else {
			$('#errors').html(errorNoCurrencyRates).removeClass('d-none');
		}
		
		return response;
	});

	return response;
}

/**
	Name: 	updateCart() 
	Desc: 	update products array with the selected quantity
	Params: id (product name), qty (quantity)
*/
function updateCart(id, qty) {
	_.each(products, function(product) {
		if (product.name == id) {
			product.quantity = qty;
		}
	});

	return products;
}

/**
	Name: 	displayCheckout() 
	Desc: 	if the cart is empty don't display anything but products list. Otherwise show 'view total' button. \
			In case the products amounts are already selected, update the total amount
	Params: -
*/
function displayCheckout() {
	var cartEmpty = true;
	for (var i = 0; i < products.length; i++) {
		if (products[i].quantity > 0) {
			cartEmpty = false;
			break;
		}
	}

	if (!cartEmpty) {
		$('#checkout').removeClass('d-none');
		updateTotalIfVisible();
	} else {
		$('#checkout').addClass('d-none');
		$('#basketTotal').addClass('d-none');
		$('#currencyConverter').addClass('d-none');
	}
}

/**
	Name: 	updateTotalIfVisible() 
	Desc: 	if the total column is visible, update the amount based on newly selected products 
	Params: -
*/
function updateTotalIfVisible() {
	if (!$('#basketTotal').hasClass('d-none')) {
		displayTotalAmount();	
	}
	
}

/**
	Name: 	checkCartChanges() 
	Desc: 	Listens to keyup event and update the cart and show 'view total' button
	Params: -
*/
function checkCartChanges() {
	$('.quantities').keyup(function(){
		var qty = $(this).val();
		var id = $(this).data('id');
		products = updateCart(id, qty);
		displayCheckout();
	})
}

//set products array
var products = getProducts();

//error handling for getting products
if (typeof products !== 'object' || !products) {
	$('#errors').html(errorNoProducts).removeClass('d-none');
}

//set currencyRates array
var currencyRates = getCurrencyRates();

initAccounting();

//display the products box
displayProducts(products);

//listen to quantities changes
checkCartChanges();

//listen to 'View Total' click event
$('#checkout').click(function() {
	displayTotalAmount();
});
