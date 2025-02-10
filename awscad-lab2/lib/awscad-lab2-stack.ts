import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

import { Construct } from 'constructs';


export class AwscadLab2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // dynamodb
    const table = new dynamodb.Table(this, 'ItemsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY, 
    });

    // iam-role  lamdba-dynamodb
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));

    //lambda
    const lambdaFunction = new lambda.Function(this, 'DynamoDBLambdaHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      role: lambdaRole,
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    //api gateway
    const api = new apigateway.RestApi(this, 'DynamoDBApi', {
      restApiName: 'DynamoDB Service',
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction);
    const items = api.root.addResource('{id}');
    items.addMethod('POST', lambdaIntegration);
    items.addMethod('GET', lambdaIntegration);

    
    table.grantReadWriteData(lambdaFunction);

  }
}