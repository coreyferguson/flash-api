
const { expect, sinon } = require('../../core/test-utils');
const logger = require('logger-for-kibana').stub;
const LocalDynamoFacade = require('local-dynamo-facade');
const CardsRepository = require('../../../src/cards/dao/repository').CardsRepository;
const path = require('path');

describe('CardsRepository integration test', () => {

  const tableName = 'cards-test';
  let repository;
  const facade = new LocalDynamoFacade( path.join(__dirname, '../../../serverless.yml') );
  const sandbox = sinon.createSandbox();

  before(async function() {
    this.timeout(5000);
    const dynamodb = facade.start();
    repository = new CardsRepository({ dynamodb, tableName, logger });
    await facade.createTable('cardsTable', tableName);
  });

  afterEach(() => {
    sandbox.restore();
  });

  after(() => {
    facade.stop();
  });

  it('log creation of card', async () => {
    sandbox.stub(logger, 'info');
    const id = 'card_id_1';
    const userId = 'user_id_1';
    const deck = 'deck_1';
    await repository.save({ userId: { S: userId }, id: { S: id }, deck: { S: deck } });
    expect(logger.info).to.be.calledOnce;
  });

  it('log lookup of card', async () => {
    sandbox.stub(logger, 'info');
    const userId = 'user_id_1';
    await repository.findByUserId(userId);
    expect(logger.info).to.be.calledOnce;
  });

  it('create and lookup card', async () => {
    const id = 'card_id_2';
    const userId = 'user_id_2';
    const deck = 'deck_2';
    await repository.save({ userId: { S: userId }, id: { S: id }, text: { S: 'text_value_2' }, deck: { S: deck } });
    const res = await repository.findByUserId(userId);
    expect(res).to.not.be.undefined;
    expect(res.Items.length).to.eql(1);
    expect(res.Items[0].id).to.be.eql({ S: 'card_id_2' });
    expect(res.Items[0].text).to.be.eql({ S: 'text_value_2' });
  });

  it('edit a card', async () => {
    const userId = 'user_id_2';
    let res = await repository.findByUserId(userId);
    res.Items[0].text.S = 'text_value_2a';
    await repository.save(res.Items[0]);
    res = await repository.findByUserId(userId);
    expect(res.Items[0].text.S).to.equal('text_value_2a');
  });

  it('retrieve a list of cards by user id', async () => {
    const userId = 'user_id_1';
    const deck = 'deck_1';
    await repository.save({ userId: { S: userId }, id: { S: 'card_id_2' }, deck: { S: deck } });
    const res = await repository.findByUserId(userId);
    expect(res).to.not.be.undefined;
    expect(res.Items.length).to.equal(2);
    expect(res.Items[0].id.S).to.equal('card_id_1');
    expect(res.Items[1].id.S).to.equal('card_id_2');
  });

  it('paginate through list of cards by user id', async () => {
    const userId = 'user_id_1';
    const res1 = await repository.findByUserId(userId, { pageSize: 1 });
    expect(res1.Items[0].id.S).to.equal('card_id_1');
    const res2 = await repository.findByUserId(userId, { pageSize: 1, after: res1.LastEvaluatedKey });
    expect(res2.Items[0].id.S).to.equal('card_id_2');
    const res3 = await repository.findByUserId(userId, { pageSize: 1, after: res2.LastEvaluatedKey });
    expect(res3.Items.length).to.equal(0);
  });

  it('retrieve cards for a given deck', async () => {
    await repository.save({ userId: { S: 'user_id_1' }, id: { S: 'card_id_3' }, deck: { S: 'deck_2' } });
    const res = await repository.findByDeck('deck_1');
    expect(res.Items.length).to.equal(2);
    expect(res.Items[0].userId.S).to.equal('user_id_1');
    expect(res.Items[0].id.S).to.equal('card_id_1');
    expect(res.Items[0].deck.S).to.equal('deck_1');
    expect(res.Items[1].userId.S).to.equal('user_id_1');
    expect(res.Items[1].id.S).to.equal('card_id_2');
    expect(res.Items[1].deck.S).to.equal('deck_1');
  });

});
