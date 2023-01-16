import { Component, OnInit , ViewChild, Inject} from '@angular/core';
import { Params } from '@angular/router';
import { Location } from '@angular/common';
import { Dish }  from '../shared/dish';
import { DishService } from '../services/dish.service';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { comment } from '../shared/comment';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { visibility, flyInOut, expand} from '../animations/app.animation';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  host:{
    '[@flyInOut]': 'true',
    'style': 'display: block;'
  },
  animations: [
    flyInOut(),
    visibility(),
    expand()
  ]
})

export class DishdetailComponent implements OnInit {
 
  dish : Dish;
  dishIds: string[];
  prev: string;
  next: string;
  commentForm: FormGroup;
  comment: comment;
  errMess: string;
  @ViewChild('cform') commentFormDirective;
  dishcopy: Dish;
  visibility = 'shown';

  formErrors = {
    'author': '',
    'comment': '',
  };

  validationMessages = {
    'author': {
      'required': 'Author Name is required.',
      'minlength': 'Author Name must be at least 2 characters long.',
      'maxlength':     'Name cannot be more than 25 characters long.'
  },
    'comment': {
    'required': 'Commentary is required.',
  }
  };

  constructor(
    private dishservice: DishService,
    private location: Location,
    private route: ActivatedRoute,
    private cb: FormBuilder,
    @Inject('BaseURL') public BaseURL)  {
    this.createForm();
  }
   

  ngOnInit(): void{
    this.dishservice.getDishIds().subscribe(dishIds => this.dishIds = dishIds);
    
    this.route.params
    .pipe(switchMap((params: Params) => {this.visibility= 'hidden'; return  this.dishservice.getDish(params['id']); }))
    .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id);this.visibility= 'shown'; },
    errmess => this.errMess = <any>errmess);
  }

  

  createForm() {
    this.commentForm = this.cb.group({
      comment : ['', [Validators.required, Validators.pattern]],
      author : ['', [Validators.required, Validators.minLength(2), Validators.maxLength(25)]],
      rating : 5,
    });

    this.commentForm.valueChanges.subscribe(data => this.onValueChanged(data));  
  
    this.onValueChanged(); 
    // (re)set validation messages now

  }

    onValueChanged(data?: any) {
    if (!this.commentForm) { return; }
    const form = this.commentForm;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }
  } 

  onSubmit() {
    this.comment = this.commentForm.value; 
    this.comment.date = new Date().toISOString();
    this.dishcopy.comments.push(this.comment);
    this.dishservice.putDish(this.dishcopy).subscribe(dish => {
        this.dish = dish;
        this.dishcopy = dish;
      }
      , errmess => {
        this.dish = null;
        this.dishcopy = null;
        this.errMess = <any>errmess;
      }
      );
    this.commentForm.reset({
      rating: 5,
      commentary: '',
      author: '',
    });
    this.commentFormDirective.resetForm();
    
}

  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }
  goBack(): void {
    this.location.back();
  }

}
