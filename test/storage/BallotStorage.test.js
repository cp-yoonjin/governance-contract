"use strict";

const ERROR_MSG = 'VM Exception while processing transaction: revert';
const { reverting } = require('openzeppelin-solidity/test/helpers/shouldFail');
const { ether } = require('openzeppelin-solidity/test/helpers/ether');
const time = require('openzeppelin-solidity/test/helpers/time');

const Registry = artifacts.require('Registry.sol');
const Staking = artifacts.require('Staking.sol');
const BallotStorage = artifacts.require('BallotStorage.sol');
const Gov = artifacts.require('Gov.sol');
const GovImp = artifacts.require('GovImp.sol');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const util = require('ethereumjs-util');
const moment = require('moment');
const web3Utils = require('web3-utils');

// const enum BallotBasicParams{
//   StartTime = 0,
//   EndTime = 1,
//   BallotType = 2,
//   Creator = 3, 
//   Memo = 4,
//   TotalVoters = 5,
//   PowerOfAccepts = 6 ,
//   PowerOfRejects = 7,
//   State = 8,
//   IsFinalized = 9,
//   Duration = 10
// }
const BallotBasicParams = {
  StartTime : 0,
  EndTime : 1,
  BallotType : 2,
  Creator : 3, 
  Memo : 4,
  TotalVoters : 5,
  PowerOfAccepts : 6 ,
  PowerOfRejects : 7,
  State : 8,
  IsFinalized : 9,
  Duration : 10
}
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

contract('BallotStorage', function ([deployer, creator, addMem, addMem2, govAddr, govAddr2, member1, member2, member3]) {
  let registry, staking, ballotStorage;
  before(async () => {
    registry = await Registry.new();
    staking = await Staking.new(registry.address);
    await registry.setContractDomain('Staking', staking.address);
    await registry.setContractDomain('GovernanceContract', govAddr);
  });
  describe('Ballot', function () {
    beforeEach(async () => {
      ballotStorage = await BallotStorage.new(registry.address);
      await registry.setContractDomain('BallotStorage', ballotStorage.address);
    });

    const _id = 1;
    const _start_time = moment.utc().add(20, 'seconds').unix();
    const _end_time = moment.utc().add(10, 'days').unix();
    const _memo = 'test message for ballot';
    const _enodeid = '0x6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0';
    const _nodeip = '123.11.111.111';
    const _nodePort = 9545;
    const _duration  = time.duration.weeks(1);
    const _lockAmount =  new web3.BigNumber(100000000);
    describe('Member', function () {
      describe('create', function () {
        describe('add', function () {
          const _ballotType = new web3.BigNumber(1); 
          it('Cannot create Ballot for MemberAdd.(not govAddr)', async () => {
           
            await reverting(ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              addMem, // newMemberAddress
              _enodeid, // newNodeId
              _nodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: creator }
            ));
          });
          it('Cannot create Ballot for MemberAdd by Invalid param(oldMemberAddress)', async () => {
            // case oldMemberAddress is set
            await reverting(ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              addMem, // oldMemberAddress
              addMem2, // newMemberAddress
              _enodeid, // newNodeId
              _nodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: creator }
            ));
          });

          it('Cannot create Ballot for MemberAdd by Invalid param(mewMemberAddress)', async () => {
            // case newMemberAddress is not set
            await reverting(ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              ZERO_ADDRESS, // newMemberAddress
              _enodeid, // newNodeId
              _nodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: creator }
            ));

            // case newMemberAddress is set invalid address
            await reverting(ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              '0xabbb12', // newMemberAddress
              _enodeid, // newNodeId
              _nodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: creator }
            ));
          });

          it('Cannot create Ballot for MemberAdd by null param(newNodeId)', async () => {
            const _emptyEnodeid = '';
            // case newNodeId is not set
            await reverting(ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              addMem, // newMemberAddress
              _emptyEnodeid, // newNodeId
              _nodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: creator }
            ));
          });

          it('Cannot create Ballot for MemberAdd by null param(newNodeIp)', async () => {
            const _emptyNodeip = '';

            // case newNodeIp is not set
            await reverting(ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              addMem, // newMemberAddress
              _enodeid, // newNodeId
              _emptyNodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: creator }
            ));
          });

          it('Cannot create Ballot for MemberAdd by null param(newNodePort)', async () => {
            const _emptyNodePort = 0;

            // case newNodePort is not set
            await reverting(ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              addMem, // newMemberAddress
              _enodeid, // newNodeId
              _nodeip, // newNodeIp
              _emptyNodePort, // newNodePort
              { value: 0, from: creator }
            ));
          });

          it('create Ballot for MemberAdd', async () => {

            await ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              addMem, // newMemberAddress
              _enodeid, // newNodeId
              _nodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: govAddr }
            ); // .should.be.rejectedWith(ERROR_MSG);

            const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);

            ballotBasicInfo[BallotBasicParams.BallotType].should.be.bignumber.equal(_ballotType);
            assert.equal(ballotBasicInfo[BallotBasicParams.Creator], creator);
            ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(0);
            ballotBasicInfo[BallotBasicParams.PowerOfAccepts].should.be.bignumber.equal(0);
            ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(0);
            ballotBasicInfo[BallotBasicParams.State].should.be.bignumber.equal(1);
            assert.equal(ballotBasicInfo[BallotBasicParams.IsFinalized], false);

            const ballotDetailInfo = await ballotStorage.getBallotMember(_id);

            assert.equal(ballotDetailInfo[0], ZERO_ADDRESS);
            assert.equal(ballotDetailInfo[1], addMem);
            assert.equal(ballotDetailInfo[2], _enodeid);
            assert.equal(web3Utils.toUtf8(ballotDetailInfo[3]), _nodeip);
            assert.equal(ballotDetailInfo[4], _nodePort);
          });
          it('cannot create Ballot by duplicated id ', async () => {
            await ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              addMem, // newMemberAddress
              _enodeid, // newNodeId
              _nodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: govAddr }
            );
            const _ballotType2 = 1; // new web3.BigNumber(1);
            const _enodeid2 = '0x6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92bb';
            const _nodeip2 = '123.11.111.112';
            const _nodePort2 = 9541;
            await reverting(ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType2, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              addMem2, // newMemberAddress
              _enodeid2, // newNodeId
              _nodeip2, // newNodeIp
              _nodePort2, // newNodePort
              { value: 0, from: govAddr }
            )); // .should.be.rejectedWith(ERROR_MSG);
        });
        describe('remove', function () {
          const _ballotType = new web3.BigNumber(2); 
          it('Cannot create Ballot for MemberRemoval by invalid param', async () => {
            const _emptyNodePort = 0;

            // case newMemberAddress is not empty
            await reverting(ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              addMem, // oldMemberAddress
              addMem, // newMemberAddress
              "", // newNodeId
              "", // newNodeIp
              0, // newNodePort
              { value: 0, from: creator }
            ));
            // case newNodeId is not empty
            await reverting(ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              addMem, // oldMemberAddress
              ZERO_ADDRESS, // newMemberAddress
              _enodeid, // newNodeId
              "", // newNodeIp
              0, // newNodePort
              { value: 0, from: creator }
            ));
            // case newNodeIp is not empty
            await reverting(ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              addMem, // oldMemberAddress
              ZERO_ADDRESS, // newMemberAddress
              "", // newNodeId
              _nodeip, // newNodeIp
              0, // newNodePort
              { value: 0, from: creator }
            ));
            // case newNodePort is not empty
            await reverting(ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              addMem, // oldMemberAddress
              ZERO_ADDRESS, // newMemberAddress
              "", // newNodeId
              "", // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: creator }
            ));
          });
          it('create Ballot for MemberRemove', async () => {
            await ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              addMem, // oldMemberAddress
              ZERO_ADDRESS, // newMemberAddress
              "0x", // newNodeId
              "", // newNodeIp
              0, // newNodePort
              { value: 0, from: govAddr }
            ); // .should.be.rejectedWith(ERROR_MSG);

            const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);

            ballotBasicInfo[BallotBasicParams.BallotType].should.be.bignumber.equal(_ballotType);
            assert.equal(ballotBasicInfo[BallotBasicParams.Creator], creator);
            ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(0);
            ballotBasicInfo[BallotBasicParams.PowerOfAccepts].should.be.bignumber.equal(0);
            ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(0);
            ballotBasicInfo[BallotBasicParams.State].should.be.bignumber.equal(1);
            assert.equal(ballotBasicInfo[BallotBasicParams.IsFinalized], false);

            const ballotDetailInfo = await ballotStorage.getBallotMember(_id);

            assert.equal(ballotDetailInfo[0], addMem);
            assert.equal(ballotDetailInfo[1], ZERO_ADDRESS);
            assert.equal(ballotDetailInfo[2], "0x");
            assert.equal(web3Utils.toUtf8(ballotDetailInfo[3]), "");
            assert.equal(ballotDetailInfo[4], 0);
          });

        });
        describe('swap', function () {
          const _ballotType = new web3.BigNumber(3); 
          it('Cannot create Ballot for MemberSwap by invalid param', async () => {
            
            // case oldMemberAddress is empty
            await reverting(ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              ZERO_ADDRESS, // oldMemberAddress
              addMem, // newMemberAddress
              _enodeid, // newNodeId
              _nodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: creator }
            ));
            // case newMemberAddress is empty
            await reverting(ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              addMem, // oldMemberAddress
              ZERO_ADDRESS, // newMemberAddress
              _enodeid, // newNodeId
              _nodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: creator }
            ));
            // case newNodeId is  empty
            await reverting(ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              addMem, // oldMemberAddress
              addMem, // newMemberAddress
              "0x", // newNodeId
              _nodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: creator }
            ));
            // case newNodeIp is empty
            await reverting(ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              addMem, // oldMemberAddress
              addMem, // newMemberAddress
              _enodeid, // newNodeId
              "0x", // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: creator }
            ));
            // case newNodePort is  empty
            await reverting(ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              addMem, // oldMemberAddress
              addMem, // newMemberAddress
              _enodeid, // newNodeId
              _nodeip, // newNodeIp
              0, // newNodePort
              { value: 0, from: creator }
            ));
          });
          it('create Ballot for MemberSwap', async () => {
            await ballotStorage.createBallotForMemeber(
              _id, // ballot id
              _ballotType, // ballot type
              creator, // creator
              addMem, // oldMemberAddress
              addMem, // newMemberAddress
              _enodeid, // newNodeId
              _nodeip, // newNodeIp
              _nodePort, // newNodePort
              { value: 0, from: govAddr }
            ); // .should.be.rejectedWith(ERROR_MSG);

            const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);

            ballotBasicInfo[BallotBasicParams.BallotType].should.be.bignumber.equal(_ballotType);
            assert.equal(ballotBasicInfo[BallotBasicParams.Creator], creator);
            ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(0);
            ballotBasicInfo[BallotBasicParams.PowerOfAccepts].should.be.bignumber.equal(0);
            ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(0);
            ballotBasicInfo[BallotBasicParams.State].should.be.bignumber.equal(1);
            assert.equal(ballotBasicInfo[BallotBasicParams.IsFinalized], false);

            const ballotDetailInfo = await ballotStorage.getBallotMember(_id);

            assert.equal(ballotDetailInfo[0], addMem);
            assert.equal(ballotDetailInfo[1], addMem);
            assert.equal(ballotDetailInfo[2], _enodeid);
            assert.equal(web3Utils.toUtf8(ballotDetailInfo[3]), _nodeip);
            assert.equal(ballotDetailInfo[4], _nodePort);
          });
        });
      });
      describe('address', function () {
        const _ballotType = new web3.BigNumber(4);

        it('Canot create Ballot for Governance Address(not govAddr)', async () => {
          await reverting(ballotStorage.createBallotForAddress(
            _id, // ballot id
            _ballotType, // ballot type
            creator, // creator
            govAddr2, // new governance contract address
            { value: 0, from: creator }
          ));
        });
    
        it('create Ballot for Governance Address', async () => {
          await ballotStorage.createBallotForAddress(
            _id, // ballot id
            _ballotType, // ballot type
            creator, // creator
            govAddr2, // new governance contract address
            { value: 0, from: govAddr }
          ); // .should.be.rejectedWith(ERROR_MSG);
    
          const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
          ballotBasicInfo[BallotBasicParams.BallotType].should.be.bignumber.equal(_ballotType);
          assert.equal(ballotBasicInfo[BallotBasicParams.Creator], creator);
          //memo 4
          ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(0);
          ballotBasicInfo[BallotBasicParams.PowerOfAccepts].should.be.bignumber.equal(0);
          ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(0);
          ballotBasicInfo[BallotBasicParams.State].should.be.bignumber.equal(1);
          assert.equal(ballotBasicInfo[BallotBasicParams.IsFinalized], false);

          const ballotDetailInfo = await ballotStorage.getBallotAddress(_id);
          // console.log(`MemberBallot : ${ballotDetailInfo}`);
          assert.equal(ballotDetailInfo, govAddr2);
        });
      });
      describe('variable', function () {
        const _id = new web3.BigNumber(4);
        const _start_time = 0;
        const _end_time = 0;
        const _ballotType = new web3.BigNumber(5);
        const _memo = 'test message for ballot';
        const _varName = web3.sha3('blockPer');
        const _varType = new web3.BigNumber(2);

        const _varVal ="0x0000000000000000000000000000000000000000000000000000000000007530";

        it('Canot create Ballot for Enviroment Variable(not govAddr)', async () => {
          // const _id = new web3.BigNumber(4);
          // const _ballotType = new web3.BigNumber(4);
          // const _memo = 'test message for ballot';
          // const _varName = web3.sha3('blockPer');
          // const _varType = new web3.BigNumber(2);
          // const _varVal = new web3.BigNumber(1000);
          await reverting(ballotStorage.createBallotForVariable(
            _id, // ballot id
            _ballotType, // ballot type
            creator, // creator
            _varName,
            _varType,
            _varVal,
            { value: 0, from: creator }
          ));
        });
    
        it('create Ballot for Enviroment Variable', async () => {

          await ballotStorage.createBallotForVariable(
            _id, // ballot id
            _ballotType, // ballot type
            creator, // creator
            _varName,
            _varType,
            _varVal,
            { value: 0, from: govAddr }
          ); // .should.be.rejectedWith(ERROR_MSG);
    
          const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
          ballotBasicInfo[BallotBasicParams.BallotType].should.be.bignumber.equal(_ballotType);
          assert.equal(ballotBasicInfo[BallotBasicParams.Creator], creator);
          //memo 4
          ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(0);
          ballotBasicInfo[6].should.be.bignumber.equal(0);
          ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(0);
          ballotBasicInfo[BallotBasicParams.State].should.be.bignumber.equal(1);
          assert.equal(ballotBasicInfo[BallotBasicParams.IsFinalized], false);
         
          const ballotDetailInfo = await ballotStorage.getBallotVariable(_id);
          // console.log(`VariableBallot : ${ballotDetailInfo}`);
        
          assert.equal(ballotDetailInfo[0], _varName);
          ballotDetailInfo[1].should.be.bignumber.equal(_varType);

          //const _val = web3Utils.hexToNumber(ballotDetailInfo[3]);
          // console.log(`Variable Value : ${_val}`);
          assert.equal(ballotDetailInfo[2], _varVal);
        });
      });
      });
    });
    describe('update', function () {
      const _ballotType = new web3.BigNumber(1); 
      beforeEach(async () => {
        await ballotStorage.createBallotForMemeber(
          _id, // ballot id
          _ballotType, // ballot type
          creator, // creator
          ZERO_ADDRESS, // oldMemberAddress
          addMem, // newMemberAddress
          _enodeid, // newNodeId
          _nodeip, // newNodeIp
          _nodePort, // newNodePort
          { value: 0, from: govAddr }
        ); // .should.be.rejectedWith(ERROR_MSG);
      });
      describe('start', function () {
        it('Start Ballot for MemberAdd', async () => {
          await ballotStorage.startBallot(_id, _start_time, _end_time, { value: 0, from: govAddr });

          const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
          assert.equal(ballotBasicInfo[BallotBasicParams.StartTime], _start_time);
          assert.equal(ballotBasicInfo[BallotBasicParams.EndTime], _end_time);
          ballotBasicInfo[BallotBasicParams.State].should.be.bignumber.equal(2); // InProgress

          const ballotBasicTime = await ballotStorage.getBallotPeriod(_id);
          assert.equal(ballotBasicTime[0], _start_time);
          assert.equal(ballotBasicTime[1], _end_time);

          const ballotBasicState = await ballotStorage.getBallotState(_id);
          ballotBasicState[0].should.be.bignumber.equal(_ballotType);
          ballotBasicState[1].should.be.bignumber.equal(2);
          assert.equal(ballotBasicState[2], false);

          const ballotBasicVotingInfo = await ballotStorage.getBallotVotingInfo(_id);
          ballotBasicVotingInfo[0].should.be.bignumber.equal(0);
          ballotBasicVotingInfo[1].should.be.bignumber.equal(0);
          ballotBasicVotingInfo[2].should.be.bignumber.equal(0);
        });
      });
      describe('setMemo', function () {
        it('update Ballot memo for MemberAdd', async () => {
          await ballotStorage.updateBallotMemo(_id,_memo,{ value: 0, from: govAddr });
          const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
          assert.equal(web3Utils.toUtf8(ballotBasicInfo[BallotBasicParams.Memo]), _memo);
        });
      });
      describe('setDuration', function () {
        it('update Ballot duration for MemberAdd', async () => {
          await ballotStorage.updateBallotDuration(_id,_duration,{ value: 0, from: govAddr });
          const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
          assert.equal(ballotBasicInfo[BallotBasicParams.Duration], _duration);
          const ballotPeriodInfo = await ballotStorage.getBallotPeriod(_id);
          assert.equal(ballotPeriodInfo[2], _duration);
        });
      });
      describe('updateLockAmount', function () {
        it('update lockAmount for MemberAdd', async () => {
          await ballotStorage.updateBallotMemberLockAmount(_id,_lockAmount,{ value: 0, from: govAddr });
          const ballotMemberInfo = await ballotStorage.getBallotMember(_id);
          ballotMemberInfo[5].should.be.bignumber.equal(_lockAmount);
        });
      });
      describe('finalize', function () {
        it('finalize Ballot for MemberAdd', async () => {

          await ballotStorage.startBallot(_id, _start_time, _end_time, { value: 0, from: govAddr });
          let ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
          assert.equal(ballotBasicInfo[BallotBasicParams.StartTime], _start_time);
          assert.equal(ballotBasicInfo[BallotBasicParams.EndTime], _end_time);
          ballotBasicInfo[BallotBasicParams.State].should.be.bignumber.equal(2); // InProgress
          let _state = 3;//accepted
          await ballotStorage.finalizeBallot(_id,_state, { value: 0, from: govAddr });
          ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
          ballotBasicInfo[BallotBasicParams.State].should.be.bignumber.equal(_state);
          assert.equal(ballotBasicInfo[BallotBasicParams.IsFinalized], true);
          const ballotBasicState = await ballotStorage.getBallotState(_id);
          ballotBasicState[0].should.be.bignumber.equal(_ballotType);
          ballotBasicState[1].should.be.bignumber.equal(_state); 
          assert.equal(ballotBasicState[2], true);
        });
      });
    });
  });
  describe('vote', function () {
    const _id = 1;
    let _start_time = 0;
    let _end_time = 0;
    // let after_end_time =  moment.utc().add(10, 'days').add(1,'seconds').unix();

    beforeEach(async () => {
      // registry = await Registry.new();
      // staking = await Staking.new(registry.address);
      // await registry.setContractDomain('Staking', staking.address);
      ballotStorage = await BallotStorage.new(registry.address);
      await registry.setContractDomain('BallotStorage', ballotStorage.address);
      // await registry.setContractDomain('GovernanceContract', govAddr);

      _start_time = moment.utc().add(1, 'seconds').unix();
      _end_time = moment.utc().add(10, 'days').unix();
      const _ballotType = 1; // new web3.BigNumber(1);
      const _enodeid = '0x6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0';
      // let _enodeid = web3Utils.hexToBytes(_enodidHexString);
      const _nodeip = '123.11.111.111';
      const _nodePort = 9545;
      await ballotStorage.createBallotForMemeber(
        _id, // ballot id
        _ballotType, // ballot type
        creator, // creator
        ZERO_ADDRESS, // oldMemberAddress
        addMem, // newMemberAddress
        _enodeid, // newNodeId
        _nodeip, // newNodeIp
        _nodePort, // newNodePort
        { value: 0, from: govAddr }
      );

      await ballotStorage.startBallot(_id, _start_time, _end_time, { value: 0, from: govAddr });
    });
    describe('create', function () {
      it('create votes', async () => {
        // 1st vote
        const _voteId = 1;
        const _decision = 1; // accept
        const _power = 10000;
  
        await ballotStorage.createVote(
          _voteId, // _voteId,
          _id, // _ballotId,
          member1, // _voter,
          _decision, // _decision,
          _power, // _power,
          { value: 0, from: govAddr }
        ); // .should.be.rejectedWith(ERROR_MSG);
  
        const voteInfo = await ballotStorage.getVote(_voteId);
        // console.log(`MemberBallotBasic : ${ballotBasicInfo}`);
  
        // assert.equal(voteInfo[0], _voteId);
        voteInfo[0].should.be.bignumber.equal(_voteId);
        // assert.equal(voteInfo[1], _Id);
        voteInfo[1].should.be.bignumber.equal(_id);
        assert.equal(voteInfo[2], member1);
        assert.equal(voteInfo[3], _decision);
        // assert.equal(voteInfo[4], _power);
        voteInfo[4].should.be.bignumber.equal(_power);
  
        let ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
        ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(1); // totalVoters
        ballotBasicInfo[6].should.be.bignumber.equal(_power); // powerOfAccepts
        ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(0); // powerOfRejects
        let ballotBasicVotingInfo = await ballotStorage.getBallotVotingInfo(_id);
        ballotBasicVotingInfo[0].should.be.bignumber.equal(1);
        ballotBasicVotingInfo[1].should.be.bignumber.equal(_power);
        ballotBasicVotingInfo[2].should.be.bignumber.equal(0);
  
  
  
        let _hasVoted = await ballotStorage.hasAlreadyVoted(_id, member1);
        assert.equal(_hasVoted, true);
  
        // 2nd Vote
        const _voteId2 = 2;
        const _decision2 = 1; // reject
        const _power2 = 40000;
        await ballotStorage.createVote(
          _voteId2, // _voteId,
          _id, // _ballotId,
          member2, // _voter,
          _decision2, // _decision,
          _power2, // _power,
          { value: 0, from: govAddr }
        );
        ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
        ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(2); // totalVoters
        ballotBasicInfo[6].should.be.bignumber.equal(_power + _power2); // powerOfAccepts
        ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(0); // powerOfRejects
  
        ballotBasicVotingInfo = await ballotStorage.getBallotVotingInfo(_id);
        ballotBasicVotingInfo[0].should.be.bignumber.equal(2);
        ballotBasicVotingInfo[1].should.be.bignumber.equal(_power + _power2);
        ballotBasicVotingInfo[2].should.be.bignumber.equal(0);
  
        _hasVoted = await ballotStorage.hasAlreadyVoted(_id, member2);
        assert.equal(_hasVoted, true);
  
        // 3rd Vote
        const _voteId3 = 3;
        const _decision3 = 2; // reject
        const _power3 = 50000;
        await ballotStorage.createVote(
          _voteId3, // _voteId,
          _id, // _ballotId,
          member3, // _voter,
          _decision3, // _decision,
          _power3, // _power,
          { value: 0, from: govAddr }
        );
        ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
        ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(3); // totalVoters
        ballotBasicInfo[6].should.be.bignumber.equal(_power + _power2); // powerOfAccepts
        ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(_power3); // powerOfRejects
  
        ballotBasicVotingInfo = await ballotStorage.getBallotVotingInfo(_id);
        ballotBasicVotingInfo[0].should.be.bignumber.equal(3);
        ballotBasicVotingInfo[1].should.be.bignumber.equal(_power + _power2);
        ballotBasicVotingInfo[2].should.be.bignumber.equal(_power3);
        _hasVoted = await ballotStorage.hasAlreadyVoted(_id, member3);
        assert.equal(_hasVoted, true);
      });
  
      it('cannot create vote - same voteId', async () => {
        const _voteId = 1;
        const _decision = 1; // accept
        const _power = 10000;
  
        const _decision2 = 2; // Reject
        const _power2 = 20000;
  
        await ballotStorage.createVote(
          _voteId, // _voteId,
          _id, // _ballotId,
          member1, // _voter,
          _decision, // _decision,
          _power, // _power,
          { value: 0, from: govAddr }
        ); // .should.be.rejectedWith(ERROR_MSG);
  
        await reverting(ballotStorage.createVote(
          _voteId, // _voteId,
          _id, // _ballotId,
          member2, // _voter,
          _decision2, // _decision,
          _power2, // _power,
          { value: 0, from: govAddr }
        ));
  
        const voteInfo = await ballotStorage.getVote(_voteId);
        // console.log(`MemberBallotBasic : ${ballotBasicInfo}`);
  
        // assert.equal(voteInfo[0], _voteId);
        voteInfo[0].should.be.bignumber.equal(_voteId);
        // assert.equal(voteInfo[1], _Id);
        voteInfo[1].should.be.bignumber.equal(_id);
        assert.equal(voteInfo[2], member1);
        assert.equal(voteInfo[3], _decision);
        // assert.equal(voteInfo[4], _power);
        voteInfo[4].should.be.bignumber.equal(_power);
  
        const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
        ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(1); // totalVoters
        ballotBasicInfo[6].should.be.bignumber.equal(_power); // powerOfAccepts
        ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(0); // powerOfRejects
  
        const _hasVoted = await ballotStorage.hasAlreadyVoted(_id, member1);
        assert.equal(_hasVoted, true);
      });
  
      it('cannot create vote - multiple vote', async () => {
        const _voteId = 1;
        const _decision = 1; // accept
        const _power = 10000;
  
        const _voteId2 = 2;
        const _decision2 = 2; // Reject
        const _power2 = 20000;
  
        await ballotStorage.createVote(
          _voteId, // _voteId,
          _id, // _ballotId,
          member1, // _voter,
          _decision, // _decision,
          _power, // _power,
          { value: 0, from: govAddr }
        ); // .should.be.rejectedWith(ERROR_MSG);

        await reverting(ballotStorage.createVote(
          _voteId2, // _voteId,
          _id, // _ballotId,
          member1, // _voter,
          _decision2, // _decision,
          _power2, // _power,
          { value: 0, from: govAddr }
        ));
  
        const voteInfo = await ballotStorage.getVote(_voteId);
        // console.log(`MemberBallotBasic : ${ballotBasicInfo}`);

        // assert.equal(voteInfo[0], _voteId);
        voteInfo[0].should.be.bignumber.equal(_voteId);
        // assert.equal(voteInfo[1], _Id);
        voteInfo[1].should.be.bignumber.equal(_id);
        assert.equal(voteInfo[2], member1);
        assert.equal(voteInfo[3], _decision);
        // assert.equal(voteInfo[4], _power);
        voteInfo[4].should.be.bignumber.equal(_power);

        const ballotBasicInfo = await ballotStorage.getBallotBasic(_id);
        ballotBasicInfo[BallotBasicParams.TotalVoters].should.be.bignumber.equal(1); // totalVoters
        ballotBasicInfo[6].should.be.bignumber.equal(_power); // powerOfAccepts
        ballotBasicInfo[BallotBasicParams.PowerOfRejects].should.be.bignumber.equal(0); // powerOfRejects
      });

      it('cannot create vote - not Existed ballot', async () => {
        const _notExistedId = 3;
        const _voteId = 1;
        const _decision = 1; // accept
        const _power = 10000;
        // await time.increaseTo(_start_time+1);
        // let _latestTime1 = await time.latest();
        // let _nowTime = await ballotStorage.getTime();
        // console.log(`step_(${_nowTime}):  ${_latestTime1},  ${_start_time}, ${_end_time}`);
        await reverting(ballotStorage.createVote(
          _voteId, // _voteId,
          _notExistedId, // _ballotId,
          member1, // _voter,
          _decision, // _decision,
          _power, // _power,
          { value: 0, from: govAddr }
        ));
      });
    });
    // describe('updateBallot Check', function () {
    // });
  });
});
