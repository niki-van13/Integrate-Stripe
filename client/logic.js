var itemsData; 
var shoppingCart = [];
var isItemsViewVisible = false;
let stripe = Stripe('pk_test_51LhXm4BKt7H2kiX1ZlTfgzOCCZorAgFuNmbizRTyRmyTgsPeztv7TXkeq5v85T97w8r4UlItiO0zpYps1lv2bZ8f00Xl2ByMSY');

/* Fetch data from the json file into a javascript object */
fetch("./assets/data.json")
.then(function(response) {
    return response.json();
})
.then(function(data) { 
    itemsData = data;
    createUIFromLoadedItemsData();
});


/* Use the data to create a list of these object on your website */
function createUIFromLoadedItemsData() {
    if (isItemsViewVisible) { return; }
    isItemsViewVisible = true;
    
    /* Create a list of the products */
    var list = document.createElement("ul");
    for(var index = 0; index < itemsData.length; index++) {
        list.appendChild(createListItem(itemsData[index]));
    }

    /* Add the list to the DOM */
    var container = document.querySelector("#main");
    if (container.firstChild) {
        container.replaceChild(list, container.firstChild);
    } else {
        container.appendChild(list);
    }
}

function createListItem(itemData) {
    /* Title */
    var title = document.createElement("h3");
    title.innerText = itemData.title;
    
    /* Description */
    var description = document.createElement("p");
    description.innerText = itemData.description;
    
    /* Image */
    var image = document.createElement("img");
    image.src = "./assets/" + itemData.image;

    /* Price */
    var price = document.createElement("span");
    price.innerText = "" + itemData.price.toLocaleString('sv-SE', {style: 'currency',currency: 'SEK',});
    
    /* Button */
    var button = document.createElement("button");
    button.innerHTML = '<i class="fa fa-cart-arrow-down" aria-hidden="true"></i>' + "&nbsp;&nbsp;&nbsp;" + "Lägg till i kundvagnen";
    button.onclick = function() {
        shoppingCart.push(itemData);
        counter = document.querySelector("#counter");
        counter.innerText = shoppingCart.length;
    };

    var item = document.createElement("li");
    item.appendChild(title);
    item.appendChild(description);
    item.appendChild(image);
    item.appendChild(price);
    item.appendChild(button);

    return item;
}


function showShoppingCart() {
    if (!isItemsViewVisible) { return; }
    isItemsViewVisible = false;

    /* Header */
    var header = document.createElement("h2");
    header.innerHTML = '<i class="fa fa-shopping-cart" aria-hidden="true"></i>' + " Kundvagn";
    
    /* Shopping list */
    var list = document.createElement("ul");
    for(var index = 0; index < shoppingCart.length; index++) {
        list.appendChild(createShoppingCartItem(shoppingCart[index], index));
    }
    var content = document.createElement("div");
	var c_center = document.createElement("center");
    var np = document.createElement("p");
	var ep = document.createElement("p");    
	var tp = document.createElement("p");
	
	 // Create a form dynamically
    var form = document.createElement("form");
	form.setAttribute("id","form-hide");
    form.setAttribute("method", "post");
   	
	var FN = document.createElement("input");
    FN.setAttribute("type", "text");
    FN.setAttribute("name", "Name");
    FN.setAttribute("placeholder", "Full Name");
	FN.setAttribute("id", "name");

	var EM = document.createElement("input");
    EM.setAttribute("type", "text");
    EM.setAttribute("name", "email");
    EM.setAttribute("placeholder", "E-mail");
	EM.setAttribute("id", "email");
	
	var TL = document.createElement("input");
    TL.setAttribute("type", "text");
    TL.setAttribute("name", "telephone");
    TL.setAttribute("placeholder", "Telephone");
	TL.setAttribute("id", "telephone");
	
    np.appendChild(FN);
	
	ep.appendChild(EM);
	
	tp.appendChild(TL);
	
	form.appendChild(np);
	form.appendChild(ep);
	form.appendChild(tp);
	
	c_center.appendChild(form);
	content.appendChild(c_center);
	
    /* Shopping info & action */
    var info = createShoppingSummary();
    

    content.appendChild(header);
    content.appendChild(list);
    content.appendChild(info); 

    var container = document.querySelector("#main");
    container.replaceChild(content, container.firstChild);
   
    let visible = document.getElementById('form-hide')
    visible.classList.remove('form-hide')
}

function createShoppingCartItem(itemData, index) {


    /* Image */
    var image = document.createElement("img");
    image.src = "./assets/" + itemData.image;

    /* Title */
    var title = document.createElement("h3");
    title.innerText = itemData.title;

    /* Price */
    var price = document.createElement("span");
    price.innerText = "" + itemData.price + " kr";
    

	
    /* Button */
    var button = document.createElement("button");
    button.innerHTML = '<i class="fa fa-trash-o" aria-hidden="true"></i>' + "&nbsp;&nbsp;&nbsp;" + "Ta bort";
    button.onclick = function() {
        /* Remove the item from the array */
        shoppingCart.splice(index, 1);
        /* Update the counter */
        counter = document.querySelector("#counter");
        counter.innerText = shoppingCart.length;
        /* Update the UI list */
        isItemsViewVisible = true;
        console.log(shoppingCart)
        showShoppingCart();
    };

    

    var item = document.createElement("li");
    item.appendChild(image);
    item.appendChild(title);
    item.appendChild(price);
    item.appendChild(button);

    return item;
}


function createShoppingSummary() {
    /* Total price */
    var totalPrice = 0;
    for(var i = 0; i < shoppingCart.length; i++) {
        totalPrice += shoppingCart[i].price;
    }
    var priceLabel = document.createElement("h2");
    priceLabel.innerText = "Totalt pris: " + totalPrice + " kr";
   
      /* Proceed button */
    var proceedButton = document.createElement("button");
	 if (totalPrice == 0) { // disable button if card empty
	    proceedButton.disabled = true;
		}else { 
		proceedButton.disabled = false;
		}
		
    proceedButton.innerHTML = '<i class="techstore-check" aria-hidden="true"></i>' + "&nbsp;&nbsp;&nbsp;" + "Slutför ditt köp";
    proceedButton.addEventListener('click', async () => {
	let formValid = validationForm()
	if (formValid) {
		let checkCustomer = await createUser()
		if (checkCustomer) {
			setTimeout( async () => {
			let createsession = await createSession(shoppingCart, checkCustomer)
			console.log(createsession);
			if (createsession) {
			return await stripe.redirectToCheckout({ sessionId: createsession });
          }
		}, 1000)
	  }
	}
		
      
  })
   

    var info = document.createElement("div");
    info.appendChild(priceLabel);
    info.appendChild(proceedButton);

    return info;
 
}
     

const createSession = async (cart, customerId) => {
  try {
    let response = await fetch("/create-checkout-session", {
      headers: { 'Content-Type': 'application/json' },
      method: "POST",
      body: JSON.stringify({cart, customerId})
    })
        let sessionId = await response.json() 
        console.log(sessionId, 'session id');
        return sessionId;
      
  } catch (error) {
    console.error("Error:", error);
  }
}



// fetch data for a new costumer 
const createUser = async () => {
  try {
    let customer = {
      email: document.getElementById('email').value,
      name: document.getElementById('name').value,
      phone: document.getElementById('telephone').value
    }
	console.log(customer)
    let response = await fetch("/create-customer", {
      headers: { 'Content-Type': 'application/json' },
      method: "POST",
      body: JSON.stringify(customer)
    })

    let customerId = await response.json()
    return customerId

  } catch (err) {
    console.error("Error:", err);
  }

}


//form validation for a costumer
function validationForm() {
  let fname = document.getElementById("name").value;
  let email = document.getElementById("email").value;
  let phoneNumber = document.getElementById("telephone").value;


  let Number = /^\+?\d[0-9 .]{7,12}\d$/;
  if(!Number.test(phoneNumber)){
      alert('Please enter your phone number).');
      document.getElementById('telephone').focus();
      return false;

  }
 let regName = /^[a-zA-Z]+ [a-zA-Z]+$/;
  if(!regName.test(fname)){
      alert('Please enter your full name (first & last name).');
      document.getElementById('name').focus();
      return false;

  }

  let validateEmail =/^([a-zA-Z0-9_.-])+@(([a-zA-Z0-9-]{2,})+.)+([a-zA-Z0-9]{2,})+$/;
  ;
  if(!validateEmail.test(email)){
      alert('Please enter your email).');
      document.getElementById('email').focus();
      return false;

  }
  
  return true;
}