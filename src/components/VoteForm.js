import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import OptionVoteForm from './OptionVoteForm';
import styled from 'styled-components';
import cookie from 'react-cookies';

const StyledVoteForm = styled.div`
  box-shadow: 0 0 5px darkgray;
  border: 1px solid lightgray;
  border-radius: 5px;
  padding: 3px;
  padding-bottom: 20px;
  background-color: white;
  max-width: 600px;
  margin: auto;
  text-align: center;
`;

const Question = styled.h1`
  margin: 0;
`;

const Instructions = styled.div`
  margin-bottom: 20px;
  color: gray;
`;

const VoteButton = styled.button`
  position: relative;
  left: 10px;
  font-size: 1.5em;
  background-color: #00aa00;
  border-radius: 5px;
  color: white;
  border: 1px solid #00ff00;
  padding: 5px 20px;
  cursor: pointer;
  margin-top: 10px;
`;

class VoteForm extends Component {
  constructor({match}) {
    super()
    this.state = {
      loading: true,
      pollId: match.params.pollId,
      selectedValues: {},
      question: '',
      canVote: false
    }
  }

  async componentDidMount() {
    const response = await fetch(`/api/poll/${this.state.pollId}`);
    this.setState({ loading: false });
    if (response.status === 404) return 
    const poll = await response.json();
    const voteCookie = cookie.load(this.state.pollId);
    if (voteCookie) return;
    this.setState({ canVote: true })
    const selectedValues = poll.options.reduce((memo, option) => {
      memo[option] = null
      return memo
    }, {})
    this.setState({selectedValues, question: poll.question, loading: false});
  }

  updateSelectedValue (optionName, value) {
    this.setState({
      selectedValues: Object.assign({}, this.state.selectedValues, {
        [optionName]: value
      })
    })
  }

  async handleVoteClick (event) {
    if (Object.values(this.state.selectedValues).some(value => value === null)) {
      // TODO: handle error
      return
    }
    const pollId = this.props.match.params.pollId;
    const expires = new Date()
    expires.setDate(expires.getDate() + 360)
    cookie.save(pollId, true, { path: '/', expires })
    const response = await fetch(`/api/vote/${pollId}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(this.state.selectedValues)
    });
    const body = await response.json();
    console.log(body);
    window.location.reload(true);
  }
  
  render() {
    const optionVoteForms = Object.keys(this.state.selectedValues).map((option, index) => (
      <OptionVoteForm
        name={option}
        selectedValue={this.state.selectedValues[option]}
        key={index}
        updateSelectedValue={this.updateSelectedValue.bind(this)}
      />
    ))
    const question = (
      <div>
        <Question>{this.state.question}</Question>
        <Instructions>Please select a grade for each option.</Instructions>
      </div>)
    if (this.state.canVote) return (
      <StyledVoteForm className='voteForm'>
        <div>{this.state.loading ? '(loading...)' : question}</div>
        {optionVoteForms}
        <VoteButton onClick={this.handleVoteClick.bind(this)}>Vote !</VoteButton>
      </StyledVoteForm>
    );
    return null;
  }
}

export default withRouter(VoteForm);