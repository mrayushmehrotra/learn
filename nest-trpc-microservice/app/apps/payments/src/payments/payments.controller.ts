import { Body, Controller, Post } from '@nestjs/common';
import { CreatePaymentRequest } from './dto/create-payment.request';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentService: PaymentsService) {}

  @Post()
  createPayment(@Body() request: CreatePaymentRequest) {
    console.log('Received payment request:', request);
    const result = this.paymentService.createPayment(request);
    console.log('Payment processed:', result);
    return result;
  }
}
