use std::time::{Duration, Instant};

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum State {
    Closed,
    Open,
    HalfOpen,
}

pub struct CircuitBreaker {
    state: State,
    failures: u32,
    last_failure: Option<Instant>,
    failure_threshold: u32,
    reset_timeout: Duration,
}

impl CircuitBreaker {
    pub fn new(failure_threshold: u32, reset_timeout: Duration) -> Self {
        Self {
            state: State::Closed,
            failures: 0,
            last_failure: None,
            failure_threshold,
            reset_timeout,
        }
    }

    pub fn allow_request(&mut self) -> bool {
        match self.state {
            State::Closed => true,
            State::Open => {
                if let Some(t) = self.last_failure {
                    if t.elapsed() >= self.reset_timeout {
                        self.state = State::HalfOpen;
                        return true;
                    }
                }
                false
            }
            State::HalfOpen => true,
        }
    }

    pub fn on_success(&mut self) {
        self.failures = 0;
        self.state = State::Closed;
    }

    pub fn on_failure(&mut self) {
        self.failures += 1;
        self.last_failure = Some(Instant::now());

        if self.failures >= self.failure_threshold {
            self.state = State::Open;
        }
    }
}
