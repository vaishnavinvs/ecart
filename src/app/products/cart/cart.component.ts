import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { FormBuilder } from '@angular/forms';
import { IPayPalConfig, ICreateOrderRequest } from 'ngx-paypal';


@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {

  public payPalConfig?: IPayPalConfig;


  allProducts:any = []
  cartTotalprice:number = 0
  proceedtoPaymentBtnClickedstatus:boolean = false
  username:string = ""
  flat:string = ""
  street:string = ""
  state:string = ""
  offerClickedstatus:boolean = false
  discountClickedstatus:boolean = false
  showSuccess:boolean = false
  showCancel:boolean = false
  showError:boolean = false
  showPaypal:boolean = false

  // address (reactive form)
  addressForm = this.fb.group({
    username:[''],
    flat:[''],
    street:[''],
    state:['']
  })

  constructor(private api:ApiService, private fb:FormBuilder){}
  
  ngOnInit(): void {
    this.api.getCart().subscribe(
      // 200
      (result:any)=>{
        console.log(result);
        this.allProducts = result
        // call getcarttotal
        this.getCartTotal()
        // paypal call
        this.initConfig()
      },
      // 400
      (result:any)=>{
        console.log(result.error);           
      }
    )
   
  }


  // get cart total
  getCartTotal(){
    let total = 0
    this.allProducts.forEach((item:any)=>{
      total += item.grandTotal
      this.cartTotalprice = Math.ceil(total)
    })
  }

  // removeItem
  removeItem(id:any){
    this.api.removecartitem(id).subscribe(
      (result:any)=>{
        this.allProducts = result
        // update cart total price
        this.getCartTotal()
        // update cart total count
        this.api.cartCount()
      },
      (result:any)=>{
        console.log(result.error);
        
      }
    )
  }

  // empty cart
  emptycart(){
    this.api.emptycart().subscribe(
      (result:any)=>{
        this.allProducts=[]
        // update cart total price
        this.getCartTotal()
        // update cart total count
        this.api.cartCount()
    },
  (result:any)=>{
    alert(result.error)
  }
    )
}

// increment cart product quantity
increment(id:any){
  this.api.incCartItem(id).subscribe(
    // 200
    (result:any)=>{
      this.allProducts = result
      // update total
      this.getCartTotal()
    },
    (result:any)=>{
      alert(result.error)

    }
  )
}


// decrement cart product quantity
decrement(id:any){
  this.api.decCartItem(id).subscribe(
    // 200
    (result:any)=>{
      this.allProducts = result
      // update total
      this.getCartTotal()
    },
    (result:any)=>{
      alert(result.error)

    }
  )
}




// submitBtnClicked
submitBtnClicked(){
  // check addressForm is valid
  if(this.addressForm.valid){
    this.proceedtoPaymentBtnClickedstatus = true
    this.username = this.addressForm.value.username||""
    this.flat = this.addressForm.value.flat||""
    this.street = this.addressForm.value.street||""
    this.state = this.addressForm.value.state||""

  }
  else
  {
    alert('Please enter valid Inputs....!')
  }
}


// offerClickedstatus
offerClicked(){
  this.offerClickedstatus = true
}


// discount50()
discount50(){
  let discount = Math.ceil(this.cartTotalprice*50/100)
  this.cartTotalprice -= discount
  this.discountClickedstatus = true
}

// makepayment()
makepayment(){
  this.showPaypal = true
}


// pay pal payment method
private initConfig(): void {
  let amount = this.cartTotalprice.toString()
  this.payPalConfig = {
  currency: 'USD',
  clientId: 'sb',
  createOrderOnClient: (data) => <ICreateOrderRequest>{
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: amount,
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: amount
            }
          }
        }
      }
    ]
  },
  advanced: {
    commit: 'true'
  },
  style: {
    label: 'paypal',
    layout: 'vertical'
  },
  onApprove: (data, actions) => {
    console.log('onApprove - transaction was approved, but not authorized', data, actions);
    actions.order.get().then((details:any) => {
      console.log('onApprove - you can get full order details inside onApprove: ', details);
    });
  },
  onClientAuthorization: (data) => {
    console.log('onClientAuthorization - you should probably inform your server about completed transaction at this point', data);
    this.showSuccess = true;
    // empty cart
    this.emptycart()
    // hide paypal
    this.showPaypal = false
    // hide proceedtoPaymentBtnClickedstatus
    this.proceedtoPaymentBtnClickedstatus = false
  },
  onCancel: (data, actions) => {
    console.log('OnCancel', data, actions);
    this.showCancel = true
    // hide paypal
    this.showPaypal = false
  },
  onError: err => {
    console.log('OnError', err);
    this.showError = true
    // hide paypal
    this.showPaypal = false
  },
  onClick: (data, actions) => {
    console.log('onClick', data, actions);
  },
};
}

// model closed function
modelClosed(){
  this.addressForm.reset()
  this.showCancel = false
  this.showError = false
  this.showSuccess = false
  this.proceedtoPaymentBtnClickedstatus =false
  this.showPaypal = false
}


}